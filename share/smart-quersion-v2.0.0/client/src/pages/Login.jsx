import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../App';
import API from '../services/api';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    React.createElement('div', { className: 'page-container' },
      React.createElement('div', { className: 'auth-container fade-in' },
        React.createElement('div', { className: 'auth-card card' },
          React.createElement('h1', { className: 'auth-title' }, '登录'),
          React.createElement('form', { onSubmit: handleSubmit },
            error ? React.createElement('div', { className: 'auth-error' }, error) : null,
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, '邮箱'),
              React.createElement('input', { className: 'input-field', type: 'email', placeholder: '请输入邮箱', value: email, onChange: e => setEmail(e.target.value), required: true })
            ),
            React.createElement('div', { className: 'form-group' },
              React.createElement('label', { className: 'form-label' }, '密码'),
              React.createElement('input', { className: 'input-field', type: 'password', placeholder: '请输入密码', value: password, onChange: e => setPassword(e.target.value), required: true })
            ),
            React.createElement('button', { className: 'btn btn-primary auth-btn', type: 'submit', disabled: loading },
              loading ? '登录中...' : '登录'
            )
          ),
          React.createElement('p', { className: 'auth-link' }, '还没有账号？', React.createElement(Link, { to: '/register' }, '立即注册'))
        )
      )
    )
  );
}
export default Login;