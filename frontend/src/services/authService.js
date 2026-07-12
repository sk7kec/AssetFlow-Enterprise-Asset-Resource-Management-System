export const registerUser = async (payload) => {
  console.info('registerUser() placeholder called with payload:', payload)

  return Promise.resolve({
    success: true,
    message: 'Registration placeholder ready for future Spring Boot integration.',
    data: payload,
  })
}

export const loginUser = async (payload) => {
  console.info('loginUser() placeholder called with payload:', payload)

  return Promise.resolve({
    success: true,
    message: 'Login placeholder ready for future Spring Boot integration.',
    data: payload,
  })
}
