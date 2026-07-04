import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { questionnaireAPI } from '../services/api';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const { user, logout } = useContext(UserContext);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadQuestionnaires(); }, []);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      const res = await questionnaireAPI.getAll();
      setQuestionnaires(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm('确定删除"' + title + '"吗？')) return;
    try {
      await questionnaireAPI.delete(id);
      setQuestionnaires(prev => prev.filter(q => q._id !== id));
    } catch (err) { alert('删除失败'); }
  };

  const handleExport = async (id, title) => {
    try {
      const res = await questionnaireAPI.exportCSV(id);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = title + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert('导出失败'); }
  };

  const copyLink = (id) => {
    const link = window.location.origin + '/fill/' + id;
    navigator.clipboard.writeText(link).then(() => alert('问卷链接已复制！'));
  };

  const aiModeLabel = (mode) => {
    if (mode === 'strict') return '严格';
    if (mode === 'moderate') return '中等';
    if (mode === 'loose') return '宽松';
    return '严格';
  };

  return (
    React.createElement('div', { className: 'page-container' },
      // 顶部导航栏
      React.createElement('div', { className: 'top-nav fade-in' },
        user
          ? React.createElement(React.Fragment, null,
              React.createElement('span', { className: 'nav-user' }, '👤 ' + user.email),
              React.createElement('button', { className: 'nav-btn', onClick: () => navigate('/dashboard') }, '管理后台'),
              React.createElement('button', { className: 'nav-btn nav-logout', onClick: () => { logout(); } }, '退出')
            )
          : React.createElement(React.Fragment, null,
              React.createElement('button', { className: 'nav-btn', onClick: () => navigate('/login') }, '登录'),
              React.createElement('button', { className: 'nav-btn nav-register', onClick: () => navigate('/register') }, '注册')
            )
      ),

      React.createElement('div', { className: 'home-header fade-in' },
        React.createElement('h1', { className: 'page-title' }, '智能问卷系统'),
        React.createElement('p', { className: 'page-subtitle' }, '创建AI智能审核问卷，防止乱填乱答。支持评分审核、多种题型、数据导出。'),
        React.createElement('div', { className: 'home-actions' },
          React.createElement('button', { className: 'btn btn-primary', onClick: () => navigate('/create') }, '创建新问卷'),
        )
      ),

      React.createElement('div', { className: 'home-content fade-in' },
        React.createElement('h2', { className: 'section-title' }, '已有问卷'),
        loading
          ? React.createElement('div', { className: 'loading' }, React.createElement('div', { className: 'loading-spinner' }), React.createElement('span', null, '加载中...'))
          : questionnaires.length === 0
            ? React.createElement('div', { className: 'empty-state' }, React.createElement('div', { className: 'empty-icon' }, '📭'), React.createElement('p', null, '还没有问卷'))
            : React.createElement('div', { className: 'questionnaire-list' },
                questionnaires.map((q, idx) =>
                  React.createElement('div', { key: q._id, className: 'questionnaire-card card' },
                    React.createElement('div', { className: 'qc-header' },
                      React.createElement('h3', { className: 'qc-title' }, q.title),
                      React.createElement('span', { className: 'badge badge-success' }, (q.questions?.length || 0) + '题')
                    ),
                    q.description ? React.createElement('p', { className: 'qc-desc' }, q.description) : null,
                    React.createElement('div', { className: 'qc-meta' },
                      React.createElement('span', null, new Date(q.createdAt).toLocaleDateString('zh-CN')),
                      React.createElement('span', null, (q.responses?.length || 0) + '份回答'),
                      React.createElement('span', { className: 'badge badge-warning' }, 'AI:' + aiModeLabel(q.aiMode))
                    ),
                    React.createElement('div', { className: 'qc-actions' },
                      React.createElement('button', { className: 'btn btn-primary btn-sm', onClick: () => navigate('/fill/' + q._id) }, '填写'),
                      React.createElement('button', { className: 'btn btn-secondary btn-sm', onClick: () => navigate('/results/' + q._id) }, '结果'),
                      React.createElement('button', { className: 'btn btn-secondary btn-sm', onClick: () => navigate('/admin/' + q._id) }, '审核日志'),
                      React.createElement('button', { className: 'btn btn-secondary btn-sm', onClick: () => copyLink(q._id) }, '复制链接'),
                      React.createElement('button', { className: 'btn btn-secondary btn-sm', onClick: () => handleExport(q._id, q.title) }, '导出CSV'),
                      user ? React.createElement('button', { className: 'btn btn-danger btn-sm', onClick: () => handleDelete(q._id, q.title) }, '删除') : null,
                    )
                  )
                )
              )
      )
    )
  );
}
export default Home;