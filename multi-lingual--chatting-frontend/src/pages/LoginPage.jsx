import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { loginUser } from '../services/api'


const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()


  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await loginUser(username, password)
      console.log(response)
      setUsername('')
      setPassword('')
      navigate('/Chat')
      localStorage.setItem('token', response.token)
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  return (
    <div className="bg-blue-200 flex justify-center items-center h-[90vh]">
      <div className="h-[50%] flex justify-center items-center flex-col w-[35%] bg-white rounded-xl shadow-lg p-4">
        <h1 className="font-extrabold  text-2xl">Login</h1>
        <form
          action="/hello"
          className="flex flex-col w-[55%]"
        >
          <input
            type="text"
            placeholder="username"
            className="m-2 p-2 rounded border "
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="password"
            className="m-2 p-2 rounded border "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded m-2"
            onClick={handleSubmit}
          >
            Login
          </button>
        </form>
        <div>
          <span>Don't have an account? </span>
          <a href="/register" className="text-blue-500 underline">
            Register
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage
