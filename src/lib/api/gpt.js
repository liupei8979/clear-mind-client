import axios from 'axios'

const fetchQuestionFromGPT = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `당신은 한국 노인을 위한 인지 능력 평가 질문을 만드는 전문 AI 도우미입니다. 
                        다음 조건을 충족하는 한 개의 명확하고 간단한 질문을 한국어로 생성해 주세요:
                        - 노인이 쉽게 이해할 수 있는 언어로 작성
                        - 기억력, 인지 능력, 일상 기능을 평가하는 질문
                        - 간단하고 명확하게 대답할 수 있는 질문
                        - 한국 문화와 노인의 생활 맥락에 적합한 질문
                        추가 설명 없이 오직 질문만 제공해 주세요.`
                    },
                    {
                        role: 'user',
                        content: '노인의 인지 기능을 평가할 수 있는 진단 질문을 생성해 주세요.'
                    }
                ],
                max_tokens: 50,
                temperature: 0.7
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                }
            }
        )

        return response.data.choices[0].message.content.trim()
    } catch (error) {
        console.error('GPT 질문 생성 오류:', error)
        throw error
    }
}
const analyzeAnswerWithGPT = async (question, userAnswer) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4-0613',
                messages: [
                    {
                        role: 'system',
                        content: `당신은 사용자의 질문과 답변을 평가하는 전문가입니다.
                            다음 내용을 분석하세요:
                            - 답변의 적절성 ("적절함" 또는 "부적절함"으로 평가)
                            - 적절성의 점수 (0에서 100까지, 높을수록 적절함)
                            - 답변에서 나타난 긍정적/부정적 특징
                            - 개선이 필요한 점
                            결과는 JSON 형식으로 반환하세요:
                            반드시 정확한 JSON 형식만 반환해야 합니다. JSON 형식이 아닐 경우 다시 작성하세요.
                            예:
                            {
                                "적절성": "적절함",
                                "점수": 85,
                                "긍정적 특징": ["명확하고 구체적인 답변", "질문과 관련성이 높음"],
                                "개선점": ["더 구체적으로 설명할 수 있음"]
                            }`
                    },
                    {
                        role: 'user',
                        content: `질문: ${question}\n답변: ${userAnswer}`
                    }
                ],
                max_tokens: 300, // 더 긴 응답을 지원
                temperature: 0.7
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                }
            }
        )

        const content = response.data.choices[0].message.content.trim()
        console.log('GPT 응답:', content)

        // JSON 파싱
        try {
            return JSON.parse(content)
        } catch (jsonError) {
            console.error('JSON 파싱 오류:', jsonError, '응답 내용:', content)
            throw new Error('응답이 유효한 JSON이 아닙니다.')
        }
    } catch (error) {
        console.error('답변 분석 오류:', error.response?.data || error.message)
        return {
            적절성: '오류',
            개선점: ['분석 실패: 유효하지 않은 JSON']
        }
    }
}

export { fetchQuestionFromGPT, analyzeAnswerWithGPT }