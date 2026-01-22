import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useSubmitFacultyFeedback, useFacultyFeedbackStats } from '@/hooks/useEnhancedLMS';
import { useProfiles, useClasses } from '@/hooks/useLMS';
import { useAuth } from '@/hooks/useAuth';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

function StarRating({ value, onChange, label }: StarRatingProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= value ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {RATING_LABELS[value - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function FacultyFeedback() {
  const { user, userRole } = useAuth();
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  
  const { data: profiles } = useProfiles();
  const { data: classes } = useClasses();
  const { data: feedbackStats } = useFacultyFeedbackStats(selectedFacultyId);
  const submitFeedback = useSubmitFacultyFeedback();

  const [ratings, setRatings] = useState({
    rating: 0,
    teaching_quality: 0,
    communication: 0,
    punctuality: 0,
    course_content: 0,
  });
  const [comments, setComments] = useState('');

  const facultyProfiles = profiles?.filter(p => p.role === 'teacher') || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId || !selectedClassId) return;
    
    await submitFeedback.mutateAsync({
      faculty_id: selectedFacultyId,
      class_id: selectedClassId,
      student_id: user?.id || '',
      ...ratings,
      comments: comments || null,
      is_anonymous: isAnonymous,
      semester: null,
      academic_year: null,
    });
    
    setSubmitted(true);
    setRatings({ rating: 0, teaching_quality: 0, communication: 0, punctuality: 0, course_content: 0 });
    setComments('');
  };

  const canViewStats = userRole === 'admin' || (userRole === 'teacher' && user?.id === selectedFacultyId);

  if (submitted) {
    return (
      <DashboardLayout>
        <Card className="max-w-lg mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-green-100 text-green-600 mb-4">
              <ThumbsUp className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your feedback has been submitted successfully.
              {isAnonymous && ' Your identity has been kept anonymous.'}
            </p>
            <Button onClick={() => setSubmitted(false)}>Submit Another Feedback</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty Feedback</h1>
          <p className="text-muted-foreground">
            {userRole === 'student' 
              ? 'Share your feedback about faculty members' 
              : 'View feedback statistics'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Feedback Form (for students) */}
          {userRole === 'student' && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Feedback</CardTitle>
                <CardDescription>Rate your experience with faculty members</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Select Faculty</Label>
                      <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                        <SelectTrigger><SelectValue placeholder="Choose faculty" /></SelectTrigger>
                        <SelectContent>
                          {facultyProfiles.map(f => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.full_name || f.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Select Course</Label>
                      <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger><SelectValue placeholder="Choose course" /></SelectTrigger>
                        <SelectContent>
                          {classes?.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.courses?.code} - {c.courses?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <StarRating
                      label="Overall Rating"
                      value={ratings.rating}
                      onChange={(v) => setRatings({ ...ratings, rating: v })}
                    />
                    <StarRating
                      label="Teaching Quality"
                      value={ratings.teaching_quality}
                      onChange={(v) => setRatings({ ...ratings, teaching_quality: v })}
                    />
                    <StarRating
                      label="Communication"
                      value={ratings.communication}
                      onChange={(v) => setRatings({ ...ratings, communication: v })}
                    />
                    <StarRating
                      label="Punctuality"
                      value={ratings.punctuality}
                      onChange={(v) => setRatings({ ...ratings, punctuality: v })}
                    />
                    <StarRating
                      label="Course Content"
                      value={ratings.course_content}
                      onChange={(v) => setRatings({ ...ratings, course_content: v })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Additional Comments (optional)</Label>
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                    <Label>Submit anonymously</Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!selectedFacultyId || !selectedClassId || ratings.rating === 0 || submitFeedback.isPending}
                  >
                    {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Stats View (for admin/faculty) */}
          {(userRole === 'admin' || userRole === 'teacher') && (
            <Card>
              <CardHeader>
                <CardTitle>Feedback Statistics</CardTitle>
                <CardDescription>
                  {userRole === 'admin' ? 'Select a faculty member to view their feedback' : 'Your feedback statistics'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {userRole === 'admin' && (
                  <div className="space-y-2">
                    <Label>Select Faculty</Label>
                    <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                      <SelectTrigger><SelectValue placeholder="Choose faculty" /></SelectTrigger>
                      <SelectContent>
                        {facultyProfiles.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.full_name || f.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {feedbackStats ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <p className="text-3xl font-bold">{feedbackStats.avgRating.toFixed(1)}</p>
                      <div className="flex justify-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(feedbackStats.avgRating) 
                                ? 'text-yellow-500 fill-yellow-500' 
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Based on {feedbackStats.totalResponses} responses
                      </p>
                    </div>

                    {[
                      { label: 'Teaching Quality', value: feedbackStats.avgTeachingQuality },
                      { label: 'Communication', value: feedbackStats.avgCommunication },
                      { label: 'Punctuality', value: feedbackStats.avgPunctuality },
                      { label: 'Course Content', value: feedbackStats.avgCourseContent },
                    ].map((stat) => (
                      <div key={stat.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{stat.label}</span>
                          <span className="font-medium">{stat.value.toFixed(1)}/5</span>
                        </div>
                        <Progress value={(stat.value / 5) * 100} />
                      </div>
                    ))}
                  </div>
                ) : selectedFacultyId ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No feedback received yet</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Select a faculty member to view statistics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>About Faculty Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Your feedback helps improve the quality of education. Please be honest and constructive
                in your responses.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Feedback is collected at the end of each semester</li>
                <li>Anonymous submissions keep your identity private</li>
                <li>Rate all categories for a complete evaluation</li>
                <li>Comments are optional but highly valuable</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
