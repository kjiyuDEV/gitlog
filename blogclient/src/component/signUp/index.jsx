import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom/cjs/react-router-dom.min';
import { TYPE } from '../../redux/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceSmile } from '@fortawesome/free-regular-svg-icons';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { removeExp } from '../../assets/utils/signup';

const SignUp = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const [msg, setMsg] = useState(null);
    const [validChk, setValidChk] = useState(false);
    const [form, setForm] = useState({
        userId: null,
        password: null,
        passwordChk: null,
        name: null,
        nickname: null,
    });

    const { auth } = useSelector((state) => {
        return {
            confirmModal: state.modals.confirmModal,
            auth: state.auth,
        };
    });

    const onChange = (e) => {
        let { value, id } = e.target;
        removeExp(value);
        console.log(value);
        if (value === '') {
            value = null;
        }
        if (id === 'passwordChk') {
            if (value !== form.password) {
                setMsg('비밀번호가 상이합니다');
            } else {
                setMsg(null);
            }
        }
        setForm({ ...form, [id]: removeExp(value) });
    };

    const onSubmit = (e) => {
        e.preventDefault();
        const { name, userId, password, nickname } = form;
        const newUser = { name, userId, password, nickname };
        dispatch({
            type: TYPE.USER_REGISTER_REQUEST,
            payload: newUser,
        });
    };

    useEffect(() => {
        // slide메뉴 경로로 유입됐을때, slide-menu를 닫게한다.
        if (document.getElementsByClassName('slide-menu') && document.getElementsByClassName('slide-menu')[0]) {
            document.getElementsByClassName('slide-menu')[0].className = 'slide-menu';
        }
    }, []);

    useEffect(() => {
        if (auth.token) {
            history.push('/');
            dispatch({
                type: TYPE.OPEN_CONFIRM_MODAL,
                data: {
                    type: 'logout',
                    title: '회원가입이 완료되었습니다.<br/> 회원권한은 추후 관리자 확인 후 <br/>부여되니 양해바랍니다.',
                    txtConfirm: '확인했습니다',
                    handleConfirm: () => {
                        dispatch({
                            type: TYPE.CLOSE_CONFIRM_MODAL,
                        });
                    },
                    handleCancel: null,
                },
            });
        }
    }, [auth.token]);

    useEffect(() => {
        setMsg(auth.errorMsg);
    }, [auth.errorMsg]);

    useEffect(() => {
        if (form.userId && form.password && form.passwordChk && form.name) {
            setValidChk(true);
        } else {
            setValidChk(false);
        }

        dispatch({
            type: TYPE.CLEAR_ERROR_REQUEST,
        });
    }, [form]);

    useEffect(() => {}, []);

    return (
        <div className="signUp">
            <p className="p">회원가입 회원정보 입력</p>
            <form className="form" onSubmit={onSubmit}>
                <div className="default-wrap" style={{ overflow: 'hidden' }}>
                    <div className="input-wrap">
                        <input
                            id="userId"
                            placeholder="* 아이디"
                            style={{ borderTop: 0 }}
                            onChange={(e) => onChange(e)}
                            className="input"
                            value={form.userId}
                        />

                        <FontAwesomeIcon className="svg" icon={faFaceSmile} color="#c5c5c5" />
                    </div>
                    <div className="input-wrap">
                        <input
                            className="input"
                            id="password"
                            type="password"
                            placeholder="* 비밀번호"
                            value={form.password}
                            onChange={(e) => onChange(e)}
                        />
                        <FontAwesomeIcon className="svg" icon={faLock} color="#c5c5c5" />
                    </div>
                    <div className="input-wrap">
                        <input
                            className="input"
                            id="passwordChk"
                            type="password"
                            value={form.passwordChk}
                            placeholder="* 비밀번호 재입력"
                            onChange={(e) => onChange(e)}
                        />
                        <FontAwesomeIcon className="svg" icon={faLock} color="#c5c5c5" />
                    </div>
                </div>
                <div className="additional-wrap" style={{ overflow: 'hidden' }}>
                    <input
                        className="input"
                        id="name"
                        placeholder="* 이름 (본명을 입력하세요)"
                        value={form.name}
                        style={{ borderTop: 0 }}
                        onChange={(e) => onChange(e)}
                    />
                    <input
                        className="input"
                        id="nickname"
                        value={form.nickname}
                        placeholder="닉네임 (모든 활동이 닉네임으로 노출됩니다)"
                        onChange={(e) => onChange(e)}
                    />
                </div>
                <p className="msg">{msg}</p>
                <input disabled={!validChk} className="signUp-submit" type="submit" value="회원가입 신청" />
            </form>
            <div className="caution">
                <p className="color-red">- * 표시의 라벨은 필수값입니다.</p>
                <p>- 닉네임은 미입력시 이름과 동일화 시킵니다.</p>
                <p>- 모든 비밀번호는 암호화되어 저장됩니다. 관리자도 몰라요.</p>
                <p>- 회원가입 이후 댓글권한은 관리자 승인 이후 부여됩니다.</p>
            </div>
        </div>
    );
};

export default withRouter(SignUp);
