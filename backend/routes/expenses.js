import express from 'express';
import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// GET expenses for a group
router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create expense
router.post('/', protect, async (req, res) => {
  try {
    const {
      groupId,
      description,
      amount,
      paidBy,
      splitType,
      splits,
      category,
      date,
      notes,
      aiGenerated,
      originalPrompt,
    } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Validate splits sum equals amount
    const splitsTotal = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(splitsTotal - amount) > 0.5) {
      return res.status(400).json({
        message: `Splits total (${splitsTotal}) must equal expense amount (${amount})`,
      });
    }

    const expense = await Expense.create({
      group: groupId,
      description,
      amount,
      paidBy,
      splitType,
      splits,
      category: category || 'other',
      date: date || Date.now(),
      notes,
      createdBy: req.user._id,
      aiGenerated: aiGenerated || false,
      originalPrompt: originalPrompt || '',
    });

    // Update group total
    group.totalExpenses += amount;
    await group.save();

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE expense
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const group = await Group.findById(expense.group);
    if (group) {
      group.totalExpenses = Math.max(0, group.totalExpenses - expense.amount);
      await group.save();
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
