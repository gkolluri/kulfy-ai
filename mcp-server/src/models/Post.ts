import mongoose, { Schema, Model, Document } from 'mongoose';

export type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  cid: string;
  title?: string;
  mime: string;
  width?: number;
  height?: number;
  userId: mongoose.Types.ObjectId;
  status: PostStatus;
  notes?: string;
  tags: mongoose.Types.ObjectId[];
  sourceUrl?: string;
  createdAt: Date;
}

const PostSchema = new Schema<IPost>({
  cid: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  title: {
    type: String,
    trim: true,
    maxlength: 140,
  },
  mime: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
  },
  height: {
    type: Number,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  tags: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  sourceUrl: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

PostSchema.index({ status: 1, createdAt: -1 });
PostSchema.index({ userId: 1, createdAt: -1 });

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;


