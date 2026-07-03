import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    emoji: { type: String, default: '👥' },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        nickname: { type: String, default: '' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalExpenses: { type: Number, default: 0 },
    currency: { type: String, default: '₹' },
  },
  { timestamps: true }
);

export default mongoose.model('Group', groupSchema);
