import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertCircle, CheckCircle, Download, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from "@/components/ui/progress";

export default function UploadUsers() {
    const { userRole } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ success: number; failed: number; errors: any[] } | null>(null);

    if (userRole !== 'admin') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[50vh]">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground">Only administrators can upload users.</p>
                </div>
            </DashboardLayout>
        )
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setProgress(0);
        }
    };

    const parseCSV = async (file: File) => {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Expected headers roughly: roll, name, branch, year, sem, section, phone, email
        const users = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Handle CSVs with quoted strings simply (imperfect but functional for simple data)
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            if (values.length < 2) continue;

            const userObj: any = {};

            // Map headers to fields
            headers.forEach((h, idx) => {
                const val = values[idx];
                if (h.includes('roll')) userObj.roll_number = val;
                else if (h.includes('name')) userObj.full_name = val;
                else if (h.includes('branch') || h.includes('dept')) userObj.department = val;
                else if (h.includes('year')) userObj.year = parseInt(val) || undefined;
                else if (h.includes('sem')) userObj.semester = val;
                else if (h.includes('sec')) userObj.section = val?.toUpperCase();
                else if (h.includes('phone')) userObj.phone = val;
                else if (h.includes('email')) userObj.email = val;
            });

            // Validation and Defaults
            if (!userObj.email && userObj.roll_number) {
                userObj.email = `${userObj.roll_number.toLowerCase()}@miracle.edu.in`;
            }
            userObj.role = 'student';
            userObj.password = 'Student@123'; // Default strong password

            if (userObj.email && userObj.full_name) {
                users.push(userObj);
            }
        }
        return users;
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setProgress(10); // Started

        try {
            const users = await parseCSV(file);
            if (users.length === 0) {
                toast.error('No valid users found in CSV');
                setUploading(false);
                return;
            }

            setProgress(30); // Parsed

            // Send to Edge Function
            // Note: For large files, we might need to chunk this. Assuming < 1000 users for this MVP.
            const { data, error } = await supabase.functions.invoke('bulk-create-users', {
                body: { users }
            });

            if (error) throw error;

            setProgress(100);
            setResult(data);
            if (data.failed === 0) {
                toast.success(`Successfully added ${data.success} users!`);
            } else {
                toast.warning(`Added ${data.success} users, but ${data.failed} failed.`);
            }
            setFile(null);
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Failed to upload users');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = "Roll No,Full Name,Branch,Year,Semester,Section,Phone,Email (Optional)";
        const sample = "22A91A0501,John Doe,CSE,3,3-2,A,9876543210,";
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sample;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-display font-bold">Bulk User Upload</h1>
                    <p className="text-muted-foreground">Upload users via CSV/Excel file</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <Upload className="h-5 w-5" />
                            </CardTitle>
                            <CardDescription>
                                Select a CSV file containing student details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                                <Input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer text-sm font-medium text-primary hover:underline mb-2"
                                >
                                    Choose CSV File
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    {file ? file.name : "No file selected"}
                                </p>
                            </div>

                            <div className="flex justify-between items-center">
                                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Template
                                </Button>
                                <Button onClick={handleUpload} disabled={!file || uploading}>
                                    {uploading ? 'Processing...' : 'Start Upload'}
                                </Button>
                            </div>

                            {uploading && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Processing...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {result ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                                            <span className="block text-2xl font-bold text-green-600">{result.success}</span>
                                            <span className="text-sm text-green-700">Successful</span>
                                        </div>
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                                            <span className="block text-2xl font-bold text-red-600">{result.failed}</span>
                                            <span className="text-sm text-red-700">Failed</span>
                                        </div>
                                    </div>
                                    {result.errors.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="font-semibold text-sm mb-2">Error Log:</h4>
                                            <div className="bg-muted p-2 rounded text-xs h-40 overflow-y-auto space-y-1">
                                                {result.errors.map((err, idx) => (
                                                    <div key={idx} className="text-destructive">
                                                        {err.email}: {err.error}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                    <Users className="h-10 w-10 mb-2 opacity-20" />
                                    <p>Upload results will appear here</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
