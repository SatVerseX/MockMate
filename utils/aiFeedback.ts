import { GoogleGenAI } from '@google/genai';
import { InterviewConfig, PerformanceMetrics, AIFeedback, TranscriptEntry } from '../types';

export interface AIAnalysisResult {
    metrics: PerformanceMetrics;
    feedback: AIFeedback;
}

export const generateInterviewFeedback = async (
    transcript: TranscriptEntry[],
    config: InterviewConfig
): Promise<AIAnalysisResult> => {
    try {
        if (!transcript || transcript.length === 0) {
            throw new Error("No transcript available for analysis");
        }

        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("Gemini API Key is missing");
        }

        const genAI = new GoogleGenAI({ apiKey });

        // Filter and format transcript for the model
        const formattedTranscript = transcript
            .map(t => `${t.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${t.text}`)
            .join('\n');

        const systemPrompt = `
            You are an expert ${config.interviewType} interviewer analyzing a transcript of a mock interview.
            
            Candidate: ${config.candidateName}
            Role: ${config.jobRole}
            Experience: ${config.experienceLevel}
            Context: ${config.jobDescription || 'N/A'}
            
            Analyze the following transcript and provide a structured assessment.
            Be strict but fair. Real interview standards apply.
            
            Output must be valid JSON matching this schema:
            {
                "metrics": {
                    "communication": number (0-100),
                    "technicalKnowledge": number (0-100),
                    "problemSolving": number (0-100),
                    "confidence": number (0-100),
                    "clarity": number (0-100),
                    "overallScore": number (0-100)
                },
                "feedback": {
                    "summary": "2-3 sentences summarizing performance",
                    "strengths": ["point 1", "point 2", "point 3", "point 4"],
                    "areasToImprove": ["point 1", "point 2", "point 3"],
                    "tips": ["actionable tip 1", "actionable tip 2", "actionable tip 3"]
                }
            }
        `;

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            config: {
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        metrics: {
                            type: 'OBJECT',
                            properties: {
                                communication: { type: 'NUMBER' },
                                technicalKnowledge: { type: 'NUMBER' },
                                problemSolving: { type: 'NUMBER' },
                                confidence: { type: 'NUMBER' },
                                clarity: { type: 'NUMBER' },
                                overallScore: { type: 'NUMBER' },
                            },
                            required: ["communication", "technicalKnowledge", "problemSolving", "confidence", "clarity", "overallScore"]
                        },
                        feedback: {
                            type: 'OBJECT',
                            properties: {
                                summary: { type: 'STRING' },
                                strengths: {
                                    type: 'ARRAY',
                                    items: { type: 'STRING' }
                                },
                                areasToImprove: {
                                    type: 'ARRAY',
                                    items: { type: 'STRING' }
                                },
                                tips: {
                                    type: 'ARRAY',
                                    items: { type: 'STRING' }
                                },
                            },
                            required: ["summary", "strengths", "areasToImprove", "tips"]
                        }
                    },
                    required: ["metrics", "feedback"]
                }
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `TRANSCRIPT:\n\n${formattedTranscript}` }]
                }
            ]
        });

        const resultText = response.text;
        if (!resultText) {
            throw new Error("Empty response from AI");
        }

        const result = JSON.parse(resultText) as AIAnalysisResult;
        return result;

    } catch (error) {
        console.error("AI Analysis Failed:", error);

        // Fallback to avoid crashing the UI
        return {
            metrics: {
                communication: 50,
                technicalKnowledge: 50,
                problemSolving: 50,
                confidence: 50,
                clarity: 50,
                overallScore: 50
            },
            feedback: {
                summary: "AI analysis failed to generate. Please check your network connection or API quota.",
                strengths: ["Unable to analyze"],
                areasToImprove: ["Unable to analyze"],
                tips: ["Try again later"]
            }
        };
    }
};
