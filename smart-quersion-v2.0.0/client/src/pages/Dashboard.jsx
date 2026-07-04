import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { questionnaireAPI } from '../services/api';


function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(UserContext);
  const [myQ, setMy] = useState([]);
  const [allQ, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await questionnaireAPI.getAll();
      setAll(res.data);
      setMy(res.data.filter(q => q.creatorId === user.id));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const del = async (id, t) => {
    if (!confirm('确定删除' + t + '吗？')) return;
    try { await questionnaireAPI.delete(id); setMy(p => p.filter(q => q._id !== id)); setAll(p => p.filter(q => q._id !== id)); }
    catch (e) { alert('失败'); }
  };

  const label = (m) => m === 'strict' ? '严格' : m === 'moderate' ? '中等' : '宽松';
  const list = tab === 'my' ? myQ : allQ;
  if (!user) return null;

  return (
    React.createElement('div', { className: 'page-container' },
      React.createElement('div', { className: 'fade-in' },
        React.createElement('h1', { className: 'page-title' }, '管理后台'),
        React.createElement('div', { className: 'dash-header' },
          React.createElement('span', { className: 'dash-user' }, '欢迎, ' + user.email),
          React.createElement('button', { className: 'btn btn-secondary btn-sm', onClick: () => { logout(); navigate('/'); } }, '退出')
        )
      ),
      React.createElement('div', { className: 'card fade-in' },
        React.createElement('div', { className: 'stats-grid' },
          React.createElement('div', { className: 'stat-item' }, React.createElement('div', { className: 'stat-number' }, allQ.length), React.createElement('div', { className: 'stat-label' }, '总问卷')),
          React.createElement('div', { className: 'stat-item' }, React.createElement('div', { className: 'stat-number' }, myQ.length), React.createElement('div', { className: 'stat-label' }, '我的')),
          React.createElement('div', { className: 'stat-item' }, React.createElement('div', { className: 'stat-number' }, allQ.reduce((s, q) => s + (q.responses?.length || 0), 0)), React.createElement('div', { className: 'stat-label' }, '总回答')),
        )
      ),
      React.createElement('div', { className: 'dash-tabs' },
        React.createElement('button', { className: 'dash-tab ' + (tab === 'all' ? 'active' : ''), onClick: () => setTab('all') }, '全部'),
        React.createElement('button', { className: 'dash-tab ' + (tab === 'my' ? 'active' : ''), onClick: () => setTab('my') }, '我的'),
      ),
      loading ? React.createElement('div', { className: 'loading' }, React.createElement('div', { className: 'loading-spinner' }))
        : list.length === 0 ? React.createElement('div', { className: 'card', style: { textAlign: 'center', padding: '40px' } }, '暂无数据')
        : React.createElement('div', { className: 'questionnaire-list' }, list.map(q =>
            React.createElement('div', { key: q._id, className: 'questionnaire-card card' },
              React.createElement('div', { className: 'qc-header' }, React.createElement('h3', { className: 'qc-title' }, q.title), React.createElement('span', { className: 'badge badge-success' }, (q.questions?.length || 0) + '题')),
              React.createElement('div', { className: 'qc-meta' }, React.createElement('span', null, new Date(q.createdAt).toLocaleDateString('zh-CN')), React.createElement('span', null, (q.responses?.length || 0) + '份回答'), React.createElement('span', { className: 'badge badge-warning' }, 'AI:' + label(q.aiMode))),
              React.createElement('div', { className: 'qc-actions' },
                React.createElement('button', { className: 'btn btn-primary btn-sm', onClick: () => navigate('/fill/' + q._id) }, '填写'),
                React.createElement('button', { className: 'btn btn-secondary btn-sm', onClick: () => navigate('/results/' + q._id) }, '结果'),
                React.createElement('button', { className: 'btn btn-secondary btn-sm', onClick: () => navigate('/admin/' + q._id) }, '日志'),
                tab === 'my' ? React.createElement('button', { className: 'btn btn-danger btn-sm', onClick: () => del(q._id, q.title) }, '删除') : null
              )
            )
          ))
    )
  );
}
export default Dashboard;