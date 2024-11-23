import { Link, useNavigate } from 'react-router-dom'

import { IoMdInformationCircleOutline } from 'react-icons/io'
import { useState } from 'react'

function SignupPage() {
    const navigate = useNavigate()
    const [isLoading, setLoading] = useState(false)
    const [clicked, setIsClicked] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [showPW, setShowPW] = useState(false)
    const [hasUpperCase, setHasUpperCase] = useState(false)

    const handleLoginClick = () => {
        setIsClicked(!clicked)
    }

    const togglePasswordVisibility = () => {
        setShowPW(!showPW)
    }

    const onChange = e => {
        const { name, value } = e.target
        let errorMessage = ''
        if (name === 'name') {
            setName(value)
        } else if (name === 'email') {
            setEmail(value)

            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errorMessage = '유효한 이메일 형식이 아닙니다.'
            }
        } else if (name === 'password') {
            setPassword(value)

            if (value.length < 6) {
                errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.'
            } else if (value.length === 0) {
                errorMessage = ' '
            }

            setHasUpperCase(/[A-Z]/.test(value))
        }

        setError(errorMessage)
    }

    const onSubmit = e => {
        e.preventDefault()
        setError('')

        if (isLoading || name === '' || email === '' || password === '') return

        setLoading(true)

        setTimeout(() => {
            // Simulate successful signup process
            console.log('User Signed Up:', { name, email })
            setLoading(false)
            navigate('/login')
        }, 2000)
    }

    return (
        <div className="flex justify-center items-center min-h-screen">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
                <h2 className="text-center text-2xl font-bold mb-8">
                    <img
                        src="/src/assets/images/logo-full-transparent.png"
                        alt="Logo"
                        className="mx-auto w-[50px] h-[50px]"
                    />
                </h2>
                <div className="mb-4">
                    <label
                        className="block text-sm text-black font-bold mb-2"
                        htmlFor="name">
                        닉네임
                    </label>
                    <input
                        type="text"
                        name="name"
                        placeholder="닉네임을 입력해주세요"
                        value={name}
                        onChange={onChange}
                        className="w-full p-3 border rounded-md focus:ring focus:ring-blue-300 text-black"
                    />
                </div>
                <div className="mb-4">
                    <label
                        className="block text-sm text-black font-bold mb-2"
                        htmlFor="email">
                        이메일
                    </label>
                    <input
                        type="email"
                        name="email"
                        placeholder="clear_mind@naver.com"
                        value={email}
                        onChange={onChange}
                        className="w-full p-3 border rounded-md focus:ring focus:ring-blue-300 text-black"
                    />
                </div>
                <div className="mb-4">
                    <label
                        className="block text-sm text-black font-bold mb-2"
                        htmlFor="password">
                        비밀번호
                    </label>
                    <div className="relative">
                        <input
                            type={showPW ? 'text' : 'password'}
                            name="password"
                            placeholder="비밀번호를 입력해주세요 (6자리 이상)"
                            value={password}
                            onChange={onChange}
                            className="w-full p-3 border rounded-md focus:ring focus:ring-blue-300 text-black"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500">
                            {showPW ? '🙈' : '👁️'}
                        </button>
                    </div>
                </div>

                {hasUpperCase && (
                    <p className="text-sm text-blue-600 flex items-center">
                        <IoMdInformationCircleOutline className="mr-1" />
                        비밀번호에 대문자가 포함되어 있습니다
                    </p>
                )}
                {error && (
                    <p className="text-sm text-red-600 flex items-center mt-2">
                        <IoMdInformationCircleOutline className="mr-1" />
                        {error}
                    </p>
                )}
                <button
                    type="submit"
                    onClick={handleLoginClick}
                    disabled={isLoading}
                    className={`w-full py-3 mt-6 text-white font-bold rounded-md ${
                        clicked ? 'bg-blue-600' : 'bg-blue-300'
                    }`}>
                    {isLoading ? '로딩중...' : '계정 생성하기'}
                </button>
                <p className="mt-6 text-center text-sm text-black">
                    이미 계정이 있으신가요?{' '}
                    <Link
                        to="/login"
                        className="text-blue-600 hover:underline">
                        로그인하기 &rarr;
                    </Link>
                </p>
            </form>
        </div>
    )
}

export default SignupPage
