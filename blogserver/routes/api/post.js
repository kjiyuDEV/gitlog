import express from 'express';

// Model
import Post from '../../models/post';
import User from '../../models/user';
import Category from '../../models/category';
import Comment from '../../models/comment';
import '@babel/polyfill';
import auth from '../../middleware/auth';
import moment from 'moment';

const router = express.Router();

import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import AWS from 'aws-sdk';
import { isNullOrUndefined } from 'util';
import Visitor from '../../models/visitor';

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_PRIVATE_KEY,
});

const uploadS3 = multer({
    storage: multerS3({
        s3,
        bucket: 'blogjiyu/upload/',
        region: 'ap-northeast-2',
        key(req, file, cb) {
            const ext = path.extname(file.originalname);
            const basename = path.basename(file.originalname, ext);
            cb(null, basename + new Date().valueOf() + ext);
        },
    }),
    limits: { fileSize: 100 * 1024 * 1024 },
});

// @route     POST api/post/image
// @desc      Create a Post
// @access    Private
router.post('/image', uploadS3.array('upload', 5), async (req, res, next) => {
    console.log('api/post/image');
    try {
        console.log(req.files.map((v) => v.location));
        res.json({ uploaded: true, url: req.files.map((v) => v.location) });
    } catch (e) {
        console.error(e);
        res.json({ uploaded: false, url: null });
    }
});

//  @route    GET api/post
//  @desc     More Loading Posts
//  @access   public
router.get('/skip/:skip', async (req, res) => {
    try {
        const postCount = await Post.countDocuments();
        const postsList = await Post.find().skip(Number(req.params.skip)).sort({ date: -1 });

        const categoryFindResult = await Category.find();
        const visitorsCount = await Visitor.findOne();

        const result = { postsList, categoryFindResult, postCount, visitorsCount };

        res.json(result);
    } catch (e) {
        console.log(e);
        res.json({ msg: '더 이상 포스트가 없습니다' });
    }
});

// @route    POST api/post
// @desc     Create a Post
// @access   Private
router.post('/', auth, uploadS3.none(), async (req, res, next) => {
    try {
        console.log(req, 'req');
        const { title, contents, previewContents, fileUrl, creator, category } = req.body;
        const newPost = await Post.create({
            title,
            contents,
            previewContents,
            fileUrl,
            creator: req.user.id,
            date: moment().utcOffset('+09:00').format('YYYY-MM-DD HH:mm'),
        });

        const findResult = await Category.findOne({
            categoryName: category,
        });

        console.log(findResult, 'Find Result!!!!');

        if (isNullOrUndefined(findResult)) {
            const newCategory = await Category.create({
                categoryName: category,
            });
            await Post.findByIdAndUpdate(newPost._id, {
                $push: { category: newCategory._id },
            });
            await Category.findByIdAndUpdate(newCategory._id, {
                $push: { posts: newPost._id },
            });
            await User.findByIdAndUpdate(req.user.id, {
                $push: {
                    posts: newPost._id,
                },
            });
        } else {
            await Category.findByIdAndUpdate(findResult._id, {
                $push: { posts: newPost._id },
            });
            await Post.findByIdAndUpdate(newPost._id, {
                category: findResult._id,
            });
            await User.findByIdAndUpdate(req.user.id, {
                $push: {
                    posts: newPost._id,
                },
            });
        }
        return res.redirect(`/api/post/${newPost._id}`);
    } catch (e) {
        console.log(e);
    }
});

// @route    POST api/post/:id
// @desc     Detail Post
// @access   Public

router.get('/:id', async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('creator', 'name')
            .populate({ path: 'category', select: 'categoryName' });
        post.views += 1;
        post.save();
        console.log(post);
        res.json(post);
    } catch (e) {
        console.error(e);
        next(e);
    }
});

// [Comments Route]

// @route Get api/post/:id/comments
// @desc  Get All Comments
// @access public

router.get('/:id/comments', async (req, res) => {
    try {
        const comment = await Post.findById(req.params.id).populate({
            path: 'comments',
        });
        const result = comment.comments;
        console.log(result, 'comment load');
        res.json(result);
    } catch (e) {
        console.log(e);
    }
});

router.post('/:id/comments', async (req, res, next) => {
    console.log(req, 'comments');
    const newComment = await Comment.create({
        contents: req.body.contents,
        creator: req.body.userId,
        creatorName: req.body.userName,
        post: req.body.id,
        date: moment().utcOffset('+09:00').format('YYYY-MM-DD HH:mm'),
    });
    console.log(newComment, 'newComment');

    try {
        await Post.findByIdAndUpdate(req.body.id, {
            $push: {
                comments: newComment._id,
            },
        });
        await User.findByIdAndUpdate(req.body.userId, {
            $push: {
                comments: {
                    post_id: req.body.id,
                    comment_id: newComment._id,
                },
            },
        });
        res.json(newComment);
    } catch (e) {
        console.log(e);
        next(e);
    }
});

// @route    Delete api/post/:id
// @desc     Delete a Post
// @access   Private

router.delete('/:id', auth, async (req, res) => {
    await Post.deleteMany({ _id: req.params.id });
    await Comment.deleteMany({ post: req.params.id });
    await User.findByIdAndUpdate(req.user.id, {
        $pull: {
            posts: req.params.id,
            comments: { post_id: req.params.id },
        },
    });
    const CategoryUpdateResult = await Category.findOneAndUpdate(
        { posts: req.params.id },
        { $pull: { posts: req.params.id } },
        { new: true },
    );

    if (CategoryUpdateResult.posts.length === 0) {
        await Category.deleteMany({ _id: CategoryUpdateResult });
    }
    return res.json({ success: true });
});

// @route    GET api/post/:id/edit
// @desc     Edit Post
// @access   Private
router.get('/:id/edit', auth, async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id).populate('creator', 'name');
        res.json(post);
    } catch (e) {
        console.error(e);
    }
});

router.post('/:id/edit', async (req, res, next) => {
    console.log(req, 'api/post/:id/edit');
    const {
        body: { title, contents, previewContents, fileUrl, id },
    } = req;

    try {
        const modified_post = await Post.findByIdAndUpdate(
            id,
            {
                title,
                contents,
                previewContents,
                fileUrl,
                date: moment().utcOffset('+09:00').format('YYYY-MM-DD HH:mm'),
            },
            { new: true },
        );
        console.log(modified_post, 'edit modified');
        res.redirect(`/api/post/${modified_post.id}`);
    } catch (e) {
        console.log(e);
        next(e);
    }
});

// @route    GET api/post/:id/like
// @desc     Edit Post
// @access   Private
router.post('/:id/likes', async (req, res, next) => {
    const postId = req.params.id;
    const userId = req.body.body.userId;
    console.log(req.body, '<req');
    console.log(userId, '<userId');
    try {
        const post = await Post.findById(postId);
        console.log(post, '!<post>');
        var likes = post.likes;
        const likesCount = post.likesCount;
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const userLikedPost = likes.includes(userId);

        if (userLikedPost) {
            // 이미 좋아요를 누른 경우, 좋아요 취소
            likes = likes.filter((likeId) => likeId.toString() !== userId);
            console.log(likes, '<<<<post.likes');
        } else {
            // 좋아요 추가
            likes.push(userId);
        }
        console.log(likes, '<likes');
        post.likes = likes;
        post.likesCount = likes.length;

        await post.save();
        res.json(post);
    } catch (e) {
        console.error(e);
        next(e);
    }
});

router.get('/category/:categoryName', async (req, res, next) => {
    try {
        const result = await Category.findOne(
            {
                categoryName: {
                    $regex: req.params.categoryName,
                    $options: 'i',
                },
            },
            'posts',
        ).populate({ path: 'posts' });
        console.log(result, 'Category Find result');
        res.send({ ...result, posts: result.posts.reverse() });
    } catch (e) {
        console.log(e);
        next(e);
    }
});

export default router;
