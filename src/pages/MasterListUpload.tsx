import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2, Download, Users, Trash2 } from 'lucide-react';

interface MasterListEntry {
    rollNumber: string;
    email: string;
    fullName: string;
    branch: string;
    section: string;
    year: number;
    regulation: string;
}

interface ParsedRow extends MasterListEntry {
    isValid: boolean;
    errors: string[];
}

export default function MasterListUpload() {
    const { userRole } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [fileName, setFileName] = useState<string>('');

    // Only admins can access this page
    if (userRole !== 'admin') {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Card className="p-8 text-center">
                        <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                        <p className="text-muted-foreground">Only administrators can upload the student master list.</p>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    const validateRow = (row: MasterListEntry): ParsedRow => {
        const errors: string[] = [];

        if (!row.rollNumber || row.rollNumber.length < 5) {
            errors.push('Invalid roll number');
        }
        if (!row.email || !row.email.includes('@')) {
            errors.push('Invalid email');
        }
        if (!row.fullName || row.fullName.length < 2) {
            errors.push('Invalid name');
        }
        if (!row.branch) {
            errors.push('Missing branch');
        }
        if (!row.section) {
            errors.push('Missing section');
        }
        if (!row.year || row.year < 1 || row.year > 4) {
            errors.push('Invalid year (1-4)');
        }
        if (!row.regulation) {
            errors.push('Missing regulation');
        }

        return {
            ...row,
            isValid: errors.length === 0,
            errors,
        };
    };

    const parseCSV = (content: string): ParsedRow[] => {
        const lines = content.trim().split('\n');
        if (lines.length < 2) return [];

        // Parse header
        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

        // Map expected columns
        const columnMap: Record<string, number> = {};
        ['roll_number', 'rollnumber', 'roll'].forEach(key => {
            const idx = header.findIndex(h => h.includes('roll'));
            if (idx !== -1) columnMap['rollNumber'] = idx;
        });
        ['email', 'mail', 'e-mail'].forEach(key => {
            const idx = header.findIndex(h => h.includes('mail'));
            if (idx !== -1) columnMap['email'] = idx;
        });
        ['full_name', 'fullname', 'name', 'student_name'].forEach(key => {
            const idx = header.findIndex(h => h.includes('name'));
            if (idx !== -1) columnMap['fullName'] = idx;
        });
        ['branch', 'department', 'dept'].forEach(key => {
            const idx = header.findIndex(h => h.includes('branch') || h.includes('dept'));
            if (idx !== -1) columnMap['branch'] = idx;
        });
        ['section', 'sec'].forEach(key => {
            const idx = header.findIndex(h => h.includes('sec'));
            if (idx !== -1) columnMap['section'] = idx;
        });
        ['year', 'yr'].forEach(key => {
            const idx = header.findIndex(h => h.includes('year'));
            if (idx !== -1) columnMap['year'] = idx;
        });
        ['regulation', 'reg'].forEach(key => {
            const idx = header.findIndex(h => h.includes('reg'));
            if (idx !== -1) columnMap['regulation'] = idx;
        });

        // Parse data rows
        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));

            const entry: MasterListEntry = {
                rollNumber: values[columnMap['rollNumber']] || '',
                email: values[columnMap['email']] || '',
                fullName: values[columnMap['fullName']] || '',
                branch: values[columnMap['branch']] || '',
                section: values[columnMap['section']] || '',
                year: parseInt(values[columnMap['year']]) || 0,
                regulation: values[columnMap['regulation']] || '',
            };

            return validateRow(entry);
        }).filter(row => row.rollNumber || row.email); // Filter out empty rows
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast({
                title: 'Invalid File',
                description: 'Please upload a CSV file.',
                variant: 'destructive',
            });
            return;
        }

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const parsed = parseCSV(content);
            setParsedData(parsed);

            const validCount = parsed.filter(r => r.isValid).length;
            toast({
                title: 'File Parsed',
                description: `Found ${parsed.length} rows. ${validCount} valid, ${parsed.length - validCount} with errors.`,
            });
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        const validRows = parsedData.filter(r => r.isValid);
        if (validRows.length === 0) {
            toast({
                title: 'No Valid Data',
                description: 'Please fix the errors in the CSV before uploading.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            // Transform to database format
            const records = validRows.map(row => ({
                roll_number: row.rollNumber.toUpperCase(),
                email: row.email.toLowerCase(),
                full_name: row.fullName,
                branch: row.branch.toUpperCase(),
                section: row.section.toUpperCase(),
                year: row.year,
                regulation: row.regulation.toUpperCase(),
                is_claimed: false,
            }));

            // Upsert to handle duplicates
            // @ts-ignore - new table not in generated types yet
            const { error } = await supabase
                .from('student_master_list')
                .upsert(records, { onConflict: 'roll_number' });

            if (error) throw error;

            toast({
                title: 'Upload Successful',
                description: `${validRows.length} student records have been uploaded.`,
            });

            // Clear the form
            setParsedData([]);
            setFileName('');
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                title: 'Upload Failed',
                description: error.message || 'Failed to upload master list.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const downloadTemplate = () => {
        const template = 'roll_number,email,full_name,branch,section,year,regulation\n21A91A05H7,sai.kumar@college.edu,Sai Kumar,CSE,A,3,R20\n21A91A0512,priya.sharma@college.edu,Priya Sharma,ECE,B,3,R20';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_master_list_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold">Student Master List</h1>
                        <p className="text-muted-foreground">
                            Upload the official student list for auto-verification
                        </p>
                    </div>
                    <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                    </Button>
                </div>

                {/* Upload Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Upload CSV File
                        </CardTitle>
                        <CardDescription>
                            Upload a CSV file containing student roll numbers, emails, and details. Students will be auto-verified when their email matches the roll number in this list.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="cursor-pointer flex flex-col items-center gap-4"
                            >
                                <div className="p-4 rounded-full bg-primary/10">
                                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                                </div>
                                {fileName ? (
                                    <div>
                                        <p className="font-medium">{fileName}</p>
                                        <p className="text-sm text-muted-foreground">Click to select a different file</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-medium">Click to select a CSV file</p>
                                        <p className="text-sm text-muted-foreground">or drag and drop</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Table */}
                {parsedData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Preview ({parsedData.length} records)
                                    </CardTitle>
                                    <CardDescription>
                                        {parsedData.filter(r => r.isValid).length} valid, {parsedData.filter(r => !r.isValid).length} with errors
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setParsedData([]);
                                            setFileName('');
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Clear
                                    </Button>
                                    <Button onClick={handleUpload} disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Upload Valid Records
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Roll Number</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Branch</TableHead>
                                            <TableHead>Section</TableHead>
                                            <TableHead>Year</TableHead>
                                            <TableHead>Regulation</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.slice(0, 50).map((row, idx) => (
                                            <TableRow key={idx} className={!row.isValid ? 'bg-destructive/5' : ''}>
                                                <TableCell>
                                                    {row.isValid ? (
                                                        <Badge className="bg-success/10 text-success">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Valid
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {row.errors[0]}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono">{row.rollNumber}</TableCell>
                                                <TableCell>{row.email}</TableCell>
                                                <TableCell>{row.fullName}</TableCell>
                                                <TableCell>{row.branch}</TableCell>
                                                <TableCell>{row.section}</TableCell>
                                                <TableCell>{row.year}</TableCell>
                                                <TableCell>{row.regulation}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {parsedData.length > 50 && (
                                <p className="text-sm text-muted-foreground mt-2 text-center">
                                    Showing first 50 of {parsedData.length} records
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>CSV Format Guide</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none">
                        <p>The CSV file should have the following columns:</p>
                        <ul>
                            <li><strong>roll_number</strong>: Student's official roll number (e.g., 21A91A05H7)</li>
                            <li><strong>email</strong>: Official college email address</li>
                            <li><strong>full_name</strong>: Student's full name</li>
                            <li><strong>branch</strong>: Department code (CSE, ECE, EEE, MECH, CIVIL, IT)</li>
                            <li><strong>section</strong>: Section letter (A, B, C, etc.)</li>
                            <li><strong>year</strong>: Year of study (1, 2, 3, or 4)</li>
                            <li><strong>regulation</strong>: Academic regulation (R20, R23, etc.)</li>
                        </ul>
                        <p className="text-muted-foreground">
                            When a student signs up with an email that matches a roll number in this list, their account will be auto-verified.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
