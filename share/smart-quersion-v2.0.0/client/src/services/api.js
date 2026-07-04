import axios from 'axios'

const API = axios.create({ baseURL: '/api' })

// 自动附加 token
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

export const questionnaireAPI = {
  create: (data) => {
    const token = localStorage.getItem('token')
    const headers = {}
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        headers['x-user-id'] = payload.id
      } catch(e) {}
    }
    return API.post('/questionnaires', data, { headers })
  },
  getAll: () => API.get('/questionnaires'),
  getById: (id) => API.get('/questionnaires/' + id),
  submit: (id, data) => API.post('/questionnaires/' + id + '/submit', data),
  getResults: (id) => API.get('/questionnaires/' + id + '/results'),
  delete: (id) => API.delete('/questionnaires/' + id),
  exportCSV: (id) => API.get('/questionnaires/' + id + '/export/csv', { responseType: 'blob' }),
}

export const aiAPI = {
  check: (question, answer) => API.post('/ai/check', { question, answer }),
  batchCheck: (answers) => API.post('/ai/batch-check', { answers }),
}

export default API
