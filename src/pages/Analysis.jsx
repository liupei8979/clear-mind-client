import { analyzeAnswerWithGPT, fetchQuestionFromGPT } from '@/lib/api/gpt'
import { useEffect, useRef, useState } from 'react'

import Analysis from '@/lib/api/analysis'
import Auth from '@/lib/api/auth' // Auth API import
import IntroImage from '@/assets/images/home_pogny.png' // 인트로 이미지
import { fetchData } from '@/lib/api/util' // fetchData 유틸 함수
import { useNavigate } from 'react-router-dom'

const VoiceChat = () => {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(0)
    const [recognition, setRecognition] = useState(null)
    const [currentAnswer, setCurrentAnswer] = useState(null)
    const [status, setStatus] = useState({ message: '시작 버튼을 눌러주세요', type: 'normal' })
    const [isStarted, setIsStarted] = useState(false)
    const [responses, setResponses] = useState([])
    const [isFinished, setIsFinished] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [isIntroStep, setIsIntroStep] = useState(true)
    const [questions, setQuestions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [evaluations, setEvaluations] = useState([])
    const [currentCount, setCurrentCount] = useState(0) // 인터뷰 카운트 상태
    const [analysisResults, setAnalysisResults] = useState([])
    const [isCameraPermissionRequested, setCameraPermissionRequested] = useState(false)

    const videoRef = useRef(null)

    const requestCameraPermission = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setErrorMsg('이 브라우저는 카메라를 지원하지 않습니다.')
            console.error('mediaDevices 또는 getUserMedia가 지원되지 않습니다.')
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setErrorMsg('')
            }
            setCameraPermissionRequested(true) // 권한 요청 상태 업데이트
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                setErrorMsg('카메라 접근이 허용되지 않았습니다.')
            } else if (error.name === 'NotFoundError') {
                setErrorMsg('사용 가능한 카메라가 없습니다.')
            } else {
                setErrorMsg('카메라 접근 중 문제가 발생했습니다.')
            }
            console.error('카메라 에러:', error)
        }
    }

    const handleStartButtonClick = async () => {
        await requestCameraPermission()
        setIsIntroStep(false) // 인트로 단계를 종료하고 메인 화면으로 이동
    }

    const fetchInterviewCount = async () => {
        try {
            const response = await Auth.getUserInterviewCount()
            setCurrentCount(response.data.count)
        } catch (error) {
            console.error('인터뷰 카운트 조회 오류:', error)
        }
    }

    const generateQuestions = async () => {
        setIsLoading(true)
        setQuestions([])

        try {
            const questionPromises = [
                fetchQuestionFromGPT(),
                fetchQuestionFromGPT(),
                fetchQuestionFromGPT()
            ]

            console.log('Fetching questions...')
            const generatedQuestions = await Promise.all(questionPromises)

            console.log('Generated Questions:', generatedQuestions)
            setQuestions(generatedQuestions)
        } catch (error) {
            console.error('질문 생성 실패:', error)
            setQuestions([])
        } finally {
            setIsLoading(false)
        }
    }

    const startConversation = async () => {
        try {
            await generateQuestions()
            setResponses([])
            setEvaluations([])
            setCurrentStep(0)
            setCurrentAnswer(null)
            setIsStarted(true)
            setIsFinished(false)

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            stream.getTracks().forEach(track => track.stop())

            if (questions.length > 0) {
                await startQuestion(0)
            } else {
                updateStatus('질문 생성 중 입니다', 'normal')
            }
        } catch (error) {
            console.error('Conversation error:', error)
            updateStatus(`오류가 발생했습니다: ${error.message}`, 'error')
            setIsStarted(false)
        }
    }

    const startQuestion = async stepIndex => {
        try {
            const startImage = captureImage()
            await sendImageToServer(startImage, stepIndex + 1)

            await speak(questions[stepIndex])
            await listen()

            const endImage = captureImage()
            await sendImageToServer(endImage, stepIndex + 1)
        } catch (error) {
            console.error('Question error:', error)
        }
    }

    const handleNextQuestion = async () => {
        stopRecognition()

        if (currentAnswer) {
            const question = questions[currentStep]

            try {
                const evaluation = await analyzeAnswerWithGPT(question, currentAnswer)
                setResponses(prev => {
                    const updatedResponses = [...prev, { question, answer: currentAnswer }]
                    console.log('Updated Responses in handleNextQuestion:', updatedResponses)
                    if (currentStep === questions.length - 1) {
                        console.log(
                            'Calling processFinalInterviewResult with responses:',
                            updatedResponses
                        )
                        processFinalInterviewResult(updatedResponses)
                    }
                    return updatedResponses
                })
                setEvaluations(prev => [...prev, evaluation])
            } catch (error) {
                console.error('답변 분석 오류:', error)
            } finally {
                setCurrentAnswer(null)
            }
        }

        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1)
            await startQuestion(currentStep + 1)
        }
    }

    const processFinalInterviewResult = async finalResponses => {
        try {
            await Auth.incrementUserInterviewCount()

            const totalScore = evaluations.reduce(
                (sum, evalResult) => sum + (evalResult?.점수 || 0),
                0
            )
            const meanScore = totalScore / evaluations.length

            const questionsAnswers = finalResponses.map((response, index) => ({
                question: response.question,
                answer: response.answer,
                order: index + 1,
                score: evaluations[index]?.점수 || 0
            }))

            const combinedData = {
                questions_answers: questionsAnswers,
                analysis_results: analysisResults,
                mean_score: meanScore
            }

            const result = await Analysis.submitInterviewResult(combinedData)
            console.log('Submit Interview Result Response:', result)
        } catch (error) {
            console.error('Interview result submission error:', error)
        }
    }

    useEffect(() => {
        fetchInterviewCount()
    }, [])

    useEffect(() => {
        if (!isIntroStep) {
            startCamera()
        }
        return () => {
            stopCamera()
        }
    }, [isIntroStep])

    useEffect(() => {
        if (isFinished) {
            stopCamera()
        }
    }, [isFinished])

    useEffect(() => {
        if (isStarted && currentStep === 0) {
            startQuestion(0)
        }
    }, [isStarted, currentStep])

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setErrorMsg('이 브라우저는 카메라를 지원하지 않습니다.')
            console.error('mediaDevices 또는 getUserMedia가 지원되지 않습니다.')
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setErrorMsg('')
            }
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                setErrorMsg('카메라 접근이 허용되지 않았습니다.')
            } else if (error.name === 'NotFoundError') {
                setErrorMsg('사용 가능한 카메라가 없습니다.')
            } else {
                setErrorMsg('카메라 접근 중 문제가 발생했습니다.')
            }
            console.error('카메라 에러:', error)
        }
    }

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
            videoRef.current.srcObject = null
        }
    }

    const updateStatus = (message, type = 'normal', isListening = false) => {
        setStatus({ message, type, isListening })
    }

    const speak = text => {
        return new Promise(resolve => {
            if (!text) {
                console.error('No text provided for speech synthesis')
                return resolve() // 빈 텍스트를 방지
            }
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = 'ko-KR'
            utterance.onend = () => {
                console.log('Speech synthesis completed for:', text)
                resolve()
            }
            utterance.onerror = err => {
                console.error('Speech synthesis error:', err)
                resolve() // 오류 시에도 프로미스 해제
            }
            updateStatus(`🔊 말하는 중: ${text}`, 'normal')
            speechSynthesis.speak(utterance)
        })
    }

    const stopRecognition = () => {
        if (recognition) {
            recognition.stop()
            setRecognition(null)
        }
    }

    const listen = async () => {
        stopRecognition()

        return new Promise((resolve, reject) => {
            try {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
                const newRecognition = new SpeechRecognition()
                newRecognition.lang = 'ko-KR'
                newRecognition.interimResults = false
                newRecognition.maxAlternatives = 1

                let isAnswered = false

                newRecognition.onstart = () => {
                    updateStatus('🎤 듣고 있습니다...', 'normal', true)
                }

                newRecognition.onresult = event => {
                    const text = event.results[0][0].transcript
                    if (text.trim()) {
                        setCurrentAnswer(text)
                        isAnswered = true
                        updateStatus('답변이 완료되었습니다.', 'success')
                        resolve(text)
                    } else {
                        handleNoSpeech()
                        reject(new Error('음성이 인식되지 않았습니다'))
                    }
                }

                newRecognition.onerror = event => {
                    handleNoSpeech()
                    reject(new Error(`음성 인식 오류: ${event.error}`))
                }

                newRecognition.onend = () => {
                    if (!isAnswered) {
                        handleNoSpeech()
                    }
                }

                setRecognition(newRecognition)
                newRecognition.start()
            } catch (err) {
                reject(new Error('음성 인식을 시작할 수 없습니다'))
            }
        })
    }

    const handleNoSpeech = () => {
        updateStatus('답변이 정확히 인식되지 않았습니다. 다시 시도해주세요.', 'error')
    }

    const retry = async () => {
        setCurrentAnswer(null)
        updateStatus('다시 답변을 시도합니다.')
        await listen()
    }

    const captureImage = () => {
        if (!videoRef.current) return null

        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight

        const context = canvas.getContext('2d')
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

        return canvas.toDataURL('image/jpeg') // Base64로 변환
    }

    const sendImageToServer = async (image, count) => {
        try {
            const userId = localStorage.getItem('userId')
            const url = `${import.meta.env.VITE_API_URL}/analyze`

            const response = await fetchData({
                url,
                method: 'POST',
                body: {
                    image,
                    count: currentCount,
                    userId
                }
            })

            if (response.success) {
                const analysisData = {
                    timestamp: response.timestamp,
                    result: [response.result[0]]
                }
                setAnalysisResults(prev => [...prev, analysisData])
            }
        } catch (error) {
            console.error('Error sending image to server:', error)
        }
    }

    if (isIntroStep) {
        return (
            <div className="w-full h-screen flex flex-col justify-center items-center px-4">
                {' '}
                {/* 양쪽 패딩 추가 */}
                <h1 className="text-2xl font-bold mb-8 text-gray-800">포근이와 대화하기</h1>
                <img
                    src={IntroImage} // 적절한 이미지 경로로 대체하세요.
                    alt="인지능력 테스트"
                    className="w-[300px] h-[300px] mb-8"
                />
                <button
                    onClick={handleStartButtonClick}
                    className="w-full max-w-3xl bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                    시작하기
                </button>
            </div>
        )
    }

    if (isFinished) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <div className="w-full max-w-3xl p-6 bg-white rounded-lg">
                    <h1 className="text-2xl font-bold mb-4 text-center">대화 결과</h1>
                    {responses.map((response, index) => (
                        <div
                            key={index}
                            className="my-4 p-4 bg-gray-100 rounded-lg">
                            <div className="font-bold text-black">Q: {response.question}</div>
                            <div className="text-black mt-1">A: {response.answer}</div>
                            <p className="text-black mt-1">
                                <strong>평가:</strong> {evaluations[index]?.['적절성'] || '분석 중'}
                            </p>
                            <p className="text-black mt-1">
                                <strong>점수:</strong> {evaluations[index]?.['점수'] || '분석 중'}
                            </p>
                            <div className="text-black mt-1">
                                <strong>긍정적 특징:</strong>
                                <ul className="list-disc list-inside mt-1 text-sm">
                                    {evaluations[index]?.['긍정적 특징'] ? (
                                        evaluations[index]['긍정적 특징'].map((feature, i) => (
                                            <li key={i}>{feature}</li>
                                        ))
                                    ) : (
                                        <li>분석 중</li>
                                    )}
                                </ul>
                            </div>
                            <div className="text-black mt-1">
                                <strong>개선점:</strong>
                                <ul className="list-disc list-inside mt-1 text-sm">
                                    {evaluations[index]?.['개선점'] ? (
                                        evaluations[index]['개선점'].map((improvement, i) => (
                                            <li key={i}>{improvement}</li>
                                        ))
                                    ) : (
                                        <li>분석 중</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => navigate('/mypage')} // /mypage로 이동
                        className="w-full py-3 mt-6 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition">
                        더 자세한 결과 보기
                    </button>
                    <button
                        onClick={startConversation}
                        className="w-full py-3 mt-6 my-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        다시 시작하기
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-screen flex flex-col">
            {/* Progress bar */}
            <div className="w-full max-w-3xl bg-gray-200 h-2 mt-4 mx-auto rounded">
                <div
                    className="bg-blue-600 h-2 rounded transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}></div>
            </div>

            {/* 상단으로 올린 섹션 */}
            <div className="flex flex-col justify-start items-center flex-grow pt-4 px-4">
                {/* 상태 메시지 */}
                <div
                    className={`text-center p-4 rounded w-full max-w-3xl ${
                        status.type === 'error'
                            ? 'bg-red-100 text-red-600'
                            : status.type === 'success'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-800'
                    }`}>
                    {status.message}
                </div>

                {/* 질문과 버튼 */}
                <div className="w-full max-w-3xl p-4 bg-white rounded-lg">
                    {/* 질문과 단계 표시 */}
                    <div className="flex justify-between items-center pb-2 mb-2">
                        <h1 className="text-lg font-bold">음성 대화 테스트</h1>
                        <div className="text-sm">
                            {currentStep + 1} / {questions.length}
                        </div>
                    </div>

                    {/* 대화 시작 버튼 */}
                    {!isStarted ? (
                        <button
                            onClick={startConversation}
                            className="w-full py-2 mb-3 bg-black text-white rounded-lg hover:opacity-90 transition">
                            {isLoading ? '질문 생성 중...' : '대화 시작'}
                        </button>
                    ) : (
                        <>
                            {/* 현재 질문 */}
                            <p className="text-center text-base mb-3">{questions[currentStep]}</p>

                            {/* 다시 답변하기 버튼 */}
                            {!currentAnswer && (
                                <button
                                    onClick={retry}
                                    className="w-full py-2 mb-3 bg-red-600 text-white rounded-lg hover:opacity-90 transition">
                                    다시 답변하기
                                </button>
                            )}

                            {/* 다음 질문 / 결과 버튼 */}
                            <button
                                onClick={handleNextQuestion}
                                className={`w-full py-2 ${
                                    currentStep === questions.length - 1
                                        ? 'bg-green-600 hover:opacity-90'
                                        : 'bg-blue-600 hover:opacity-90'
                                } text-white rounded-lg transition`}>
                                {currentStep === questions.length - 1
                                    ? '결과 보기'
                                    : '다음 질문으로'}
                            </button>
                        </>
                    )}
                </div>

                {/* 비디오 영역 */}
                <div className="relative bg-gray-100 rounded-lg overflow-hidden mt-4 w-full max-w-3xl">
                    {errorMsg && (
                        <div className="absolute inset-0 flex items-center justify-center text-red-500">
                            {errorMsg}
                        </div>
                    )}
                    <video
                        ref={videoRef}
                        className="w-full h-[400px] object-cover transform scale-x-[-1]"
                        autoPlay
                        playsInline
                    />
                </div>
            </div>
        </div>
    )
}

export default VoiceChat
