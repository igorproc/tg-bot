import axios from "axios";

export function createRequestInstance(payload) {
    let axiosInstance = null

    const createInstance = () => {
        const instance = axios.create()

        instance.defaults.baseURL = payload.apiUrl
        instance.defaults.withCredentials = true
        instance.defaults.headers['Content-Type'] = 'application/json'

        return instance
    }
    axiosInstance = createInstance()

    return async (method, slug, secureKey = null, data = null) => {
        if (!axiosInstance) {
            axiosInstance = createInstance()
        }

        const headers = {}
        if (secureKey) {
            headers[payload.secure.header] = secureKey
        }

        try {
            const response = await axiosInstance.request({
                method,
                url: slug,
                data: data || {},
                headers,
            })

            return response.data
        } catch (error) {
            console.warn(error)
            throw error
        }
    }
}
