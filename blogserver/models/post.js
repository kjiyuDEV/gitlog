import mongoose from 'mongoose';
import moment from 'moment';

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        index: true,
    },
    contents: {
        type: String,
        required: true,
    },
    previewContents: {
        type: String,
        required: true,
    },
    views: {
        type: Number,
        default: -2,
    },
    fileUrl: {
        type: String,
        default: 'https://source.unsplash.com/random/301x201',
    },
    date: {
        type: String,
        default: moment().format('YYYY-MM-DD HH:mm'),
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'comment',
        },
    ],
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
    ],
    likesCount: {
        type: Number,
        default: 0,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
});

const Post = mongoose.model('post', PostSchema);

export default Post;
