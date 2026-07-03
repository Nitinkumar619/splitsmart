import mongoose from 'mongoose';

const splitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String },
  amount: { type: Number, required: true },
  percentage: { type: Number },
  isPaid: { type: Boolean, default: false },
});

const expenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    splits: [splitSchema],
    splitType: {
      type: String,
      enum: ['equal', 'custom', 'percentage'],
      default: 'equal',
    },
    category: {
      type: String,
      enum: ['food', 'transport', 'accommodation', 'entertainment', 'shopping', 'utilities', 'other'],
      default: 'other',
    },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    aiGenerated: { type: Boolean, default: false },
    originalPrompt: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
