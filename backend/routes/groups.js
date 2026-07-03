import express from 'express';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// GET all groups for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create group
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, emoji, memberEmails, currency } = req.body;

    // Resolve member emails to user IDs
    const members = [{ user: req.user._id }];
    if (memberEmails && memberEmails.length > 0) {
      for (const email of memberEmails) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && user._id.toString() !== req.user._id.toString()) {
          members.push({ user: user._id });
        }
      }
    }

    const group = await Group.create({
      name,
      description,
      emoji: emoji || '👥',
      members,
      createdBy: req.user._id,
      currency: currency || '₹',
    });

    const populated = await Group.findById(group._id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single group + balances
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add member to group
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { email } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found with that email' });

    const alreadyMember = group.members.some(
      (m) => m.user.toString() === user._id.toString()
    );
    if (alreadyMember) return res.status(400).json({ message: 'Already a member' });

    group.members.push({ user: user._id });
    await group.save();

    const populated = await Group.findById(group._id).populate('members.user', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET balances for a group (the core settlement algorithm)
router.get('/:id/balances', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members.user', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const expenses = await Expense.find({ group: req.params.id })
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email');

    // Net balance per user: positive = owed money, negative = owes money
    const balanceMap = {};
    group.members.forEach((m) => {
      balanceMap[m.user._id.toString()] = {
        user: m.user,
        net: 0,
      };
    });

    expenses.forEach((expense) => {
      const payerId = expense.paidBy._id.toString();
      if (balanceMap[payerId] !== undefined) {
        balanceMap[payerId].net += expense.amount;
      }
      expense.splits.forEach((split) => {
        const splitUserId = split.user._id.toString();
        if (balanceMap[splitUserId] !== undefined) {
          balanceMap[splitUserId].net -= split.amount;
        }
      });
    });

    // Greedy settlement algorithm: minimize number of transactions
    const balances = Object.values(balanceMap);
    const creditors = balances.filter((b) => b.net > 0.01).sort((a, b) => b.net - a.net);
    const debtors = balances.filter((b) => b.net < -0.01).sort((a, b) => a.net - b.net);

    const settlements = [];
    let i = 0, j = 0;
    const cred = creditors.map((c) => ({ ...c, net: c.net }));
    const debt = debtors.map((d) => ({ ...d, net: d.net }));

    while (i < cred.length && j < debt.length) {
      const amount = Math.min(cred[i].net, -debt[j].net);
      settlements.push({
        from: debt[j].user,
        to: cred[i].user,
        amount: Math.round(amount * 100) / 100,
      });
      cred[i].net -= amount;
      debt[j].net += amount;
      if (Math.abs(cred[i].net) < 0.01) i++;
      if (Math.abs(debt[j].net) < 0.01) j++;
    }

    res.json({
      balances: balances.map((b) => ({ ...b, net: Math.round(b.net * 100) / 100 })),
      settlements,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
