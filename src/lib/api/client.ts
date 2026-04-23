// API Client sử dụng SDK được generate từ Swagger
import { Api } from './index'
import { API_CONFIG } from './config'

// Tạo instance API client
export const apiClient = new Api({
  baseUrl: API_CONFIG.BASE_URL,
  baseApiParams: {
    headers: API_CONFIG.HEADERS,
  },
})

// Export để sử dụng trong các service khác
export default apiClient
