import axios from 'axios';

const setAuthToken = (token) => {
	if (token) {
		// 设置 token
		axios.defaults.headers.common['Authorization'] = token;
	} else {
		delete axios.defaults.headers.common['Authorization'];
	}
};

export default setAuthToken;