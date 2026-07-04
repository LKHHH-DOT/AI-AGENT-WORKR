import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../App';
import API from '../services/api';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const { login } = useContext(UserContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/register', { username, email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    React.createElement('div', { className: 'page-container' },
      React.createElement('div', { className: 'auth-container fade-in' },
        React.createElement('div', { className: 'auth-card card' },
          React.createElement('h1', { className: 'auth-title' }, '注册'),
          React.createElement('form', { onSubmit: handleSubmit },
            error ? React.createElement('div', { className: 'auth-error' }, error) : null,
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, '用户名'),
              React.createElement('input', { className: 'input-field', placeholder: '请输入用户名', value: username, onChange: e => setUsername(e.target.value), required: true })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, '邮箱'),
              React.createElement('input', { className: 'input-field', type: 'email', placeholder: '请输入邮箱', value: email, onChange: e => setEmail(e.target.value), required: true })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, '密码'),
              React.createElement('input', { className: 'input-field', type: 'password', placeholder: '至少6位密码', value: password, onChange: e => setPassword(e.target.value), required: true, minLength: 6 })
            ),
            React.createElement('button', { className: 'btn btn-primary auth-btn', type: 'submit', disabled: loading },
              loading ? '注册中...' : '注册'
            )
          ),
          React.createElement('p', { className: 'auth-link' }, '已有账号？', React.createElement(Link, { to: '/login' }, '立即登录'))
        )
      )
    )
  );
}
export default Register;