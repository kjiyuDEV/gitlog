import axios from 'axios';
import { call, put, takeEvery, all, fork } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import { TYPE } from '../types';

// Load Comment

const loadCommentsAPI = (payload) => {
    console.log(payload, 'loadCommentAPI ID');
    return axios.get(`/api/post/${payload}/comments`);
};

function* loadComments(action) {
    try {
        const result = yield call(loadCommentsAPI, action.payload);
        console.log(result);
        yield put({
            type: TYPE.COMMENT_LOADING_SUCCESS,
            payload: result.data,
        });
    } catch (e) {
        console.log(e);
        yield put({
            type: TYPE.COMMENT_LOADING_FAILURE,
            payload: e,
        });
        yield push('/');
    }
}

function* watchLoadComments() {
    yield takeEvery(TYPE.COMMENT_LOADING_REQUEST, loadComments);
}

// UpLoad Comment

const uploadCommentsAPI = (payload) => {
    console.log(payload.id, 'loadCommentAPI ID');
    return axios.post(`/api/post/${payload.id}/comments`, payload);
};

function* uploadComments(action) {
    try {
        console.log(action);
        const result = yield call(uploadCommentsAPI, action.payload);
        console.log(result, 'UploadComment');
        yield put({
            type: TYPE.COMMENT_UPLOADING_SUCCESS,
            payload: result.data,
        });
    } catch (e) {
        console.log(e);
        yield put({
            type: TYPE.COMMENT_UPLOADING_FAILURE,
            payload: e,
        });
        yield push('/');
    }
}

function* watchUpLoadComments() {
    yield takeEvery(TYPE.COMMENT_UPLOADING_REQUEST, uploadComments);
}

export default function* commentSaga() {
    yield all([fork(watchLoadComments), fork(watchUpLoadComments)]);
}
