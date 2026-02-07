import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Interview config for database
export interface InterviewConfigDB {
    candidateName: string;
    jobRole: string;
    jobDescription: string;
    experienceLevel: string;
    interviewType: string;
    companyName?: string;
    skills?: string;
    duration: number;
}

// Performance metrics
export interface PerformanceMetricsDB {
    communication: number;
    technicalKnowledge: number;
    problemSolving: number;
    confidence: number;
    clarity: number;
    overallScore: number;
}

// AI Feedback
export interface AIFeedbackDB {
    summary: string;
    strengths: string[];
    areasToImprove: string[];
    tips: string[];
    recommendedResources?: string[];
}

// Transcript entry
export interface TranscriptEntryDB {
    id: string;
    speaker: 'ai' | 'user';
    text: string;
    timestamp: string;
}

// Interview with full details
export interface InterviewWithDetails {
    id: string;
    userId: string;
    config: InterviewConfigDB;
    status: string;
    duration: number | null;
    questionsAsked: number;
    warningCount: number;
    overallScore: number | null;
    metrics: PerformanceMetricsDB | null;
    feedback: AIFeedbackDB | null;
    createdAt: Date;
    transcript?: TranscriptEntryDB[];
}

// Hook to fetch user's interviews
export function useInterviews() {
    const { user } = useAuth();
    const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInterviews = useCallback(async () => {
        if (!user) {
            setInterviews([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('interviews')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mapped: InterviewWithDetails[] = (data || []).map((row: any) => ({
                id: row.id,
                userId: row.user_id,
                config: row.config as InterviewConfigDB,
                status: row.status,
                duration: row.duration,
                questionsAsked: row.questions_asked,
                warningCount: row.warning_count,
                overallScore: row.overall_score,
                metrics: row.metrics as PerformanceMetricsDB | null,
                feedback: row.feedback as AIFeedbackDB | null,
                createdAt: new Date(row.created_at),
            }));

            setInterviews(mapped);
        } catch (err) {
            console.error('Error fetching interviews:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch interviews');
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]); // Use user.id instead of user object to prevent re-fetch on auth refresh

    useEffect(() => {
        fetchInterviews();
    }, [fetchInterviews]);

    const clearHistory = async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('interviews')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            setInterviews([]);
        } catch (err) {
            console.error('Error clearing history:', err);
            setError(err instanceof Error ? err.message : 'Failed to clear history');
        }
    };

    return { interviews, isLoading, error, refetch: fetchInterviews, clearHistory };
}

// Hook to save an interview
export function useSaveInterview() {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const saveInterview = async (data: {
        config: InterviewConfigDB;
        status?: string;
        duration?: number;
        questionsAsked?: number;
        warningCount?: number;
        overallScore?: number;
        metrics?: PerformanceMetricsDB;
        feedback?: AIFeedbackDB;
        transcript?: TranscriptEntryDB[];
    }): Promise<string | null> => {
        if (!user) {
            setError('Must be logged in to save interview');
            return null;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Insert interview
            const { data: interview, error: interviewError } = await supabase
                .from('interviews')
                .insert({
                    user_id: user.id,
                    config: data.config,
                    status: data.status || 'completed',
                    duration: data.duration || null,
                    questions_asked: data.questionsAsked || 0,
                    warning_count: data.warningCount || 0,
                    overall_score: data.overallScore || null,
                    metrics: data.metrics || null,
                    feedback: data.feedback || null,
                })
                .select()
                .single();

            if (interviewError) throw interviewError;
            if (!interview) throw new Error('Failed to create interview');

            // Insert transcript if provided
            if (data.transcript && data.transcript.length > 0) {
                const { error: transcriptError } = await supabase
                    .from('interview_transcripts')
                    .insert({
                        interview_id: interview.id,
                        entries: data.transcript,
                    });

                if (transcriptError) {
                    console.error('Error saving transcript:', transcriptError);
                }
            }

            return interview.id;
        } catch (err) {
            console.error('Error saving interview:', err);
            setError(err instanceof Error ? err.message : 'Failed to save interview');
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    return { saveInterview, isSaving, error };
}

// Hook to get a single interview with transcript
export function useInterview(interviewId: string | null) {
    const { user } = useAuth();
    const [interview, setInterview] = useState<InterviewWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !interviewId) {
            setInterview(null);
            setIsLoading(false);
            return;
        }

        const fetchInterview = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch interview
                const { data: interviewData, error: interviewError } = await supabase
                    .from('interviews')
                    .select('*')
                    .eq('id', interviewId)
                    .single();

                if (interviewError) throw interviewError;
                if (!interviewData) throw new Error('Interview not found');

                // Fetch transcript
                const { data: transcriptData } = await supabase
                    .from('interview_transcripts')
                    .select('entries')
                    .eq('interview_id', interviewId)
                    .single();

                const mapped: InterviewWithDetails = {
                    id: interviewData.id,
                    userId: interviewData.user_id,
                    config: interviewData.config as InterviewConfigDB,
                    status: interviewData.status,
                    duration: interviewData.duration,
                    questionsAsked: interviewData.questions_asked,
                    warningCount: interviewData.warning_count,
                    overallScore: interviewData.overall_score,
                    metrics: interviewData.metrics as PerformanceMetricsDB | null,
                    feedback: interviewData.feedback as AIFeedbackDB | null,
                    createdAt: new Date(interviewData.created_at),
                    transcript: transcriptData?.entries as TranscriptEntryDB[] | undefined,
                };

                setInterview(mapped);
            } catch (err) {
                console.error('Error fetching interview:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch interview');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInterview();
    }, [user, interviewId]);

    return { interview, isLoading, error };
}

// Hook to update user profile
export function useUpdateProfile() {
    const { user } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);

    const updateProfile = async (data: { fullName?: string; avatarUrl?: string }) => {
        if (!user) return false;

        setIsUpdating(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: data.fullName,
                    avatar_url: data.avatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Error updating profile:', err);
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    return { updateProfile, isUpdating };
}
