
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateCourse } from '@/hooks/useLMS';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookPlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DEPARTMENTS = [
    { value: 'CSE', label: 'CSE' },
    { value: 'ECE', label: 'ECE' },
    { value: 'EEE', label: 'EEE' },
    { value: 'MECH', label: 'Mechanical' },
    { value: 'CIVIL', label: 'Civil' },
    { value: 'Basic Science', label: 'Basic Science' },
    { value: 'Humanities', label: 'Humanities' },
    { value: 'Engineering Science', label: 'Engineering Science' },
    { value: 'Management', label: 'Management' },
];

const REGULATIONS = [
    { value: 'R23', label: 'R23' },
    { value: 'R22', label: 'R22' },
    { value: 'R21', label: 'R21' },
    { value: 'R20', label: 'R20' },
];

const courseSchema = z.object({
    name: z.string().min(1, 'Course name is required'),
    code: z.string().min(1, 'Course code is required'),
    description: z.string().optional(),
    department: z.string().min(1, 'Department is required'),
    semester: z.string().min(1, 'Semester is required'), // Form uses string, we convert to number
    credits: z.string().min(1, 'Credits is required'), // Form uses string, we convert to number
    regulation: z.string().min(1, 'Regulation is required'),
    units: z.array(z.object({
        title: z.string().min(1, 'Unit title is required'),
        content: z.string().min(1, 'Unit content is required'),
    })).optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function AddSubjectDialog() {
    const [open, setOpen] = useState(false);
    const createCourse = useCreateCourse();

    const form = useForm<CourseFormValues>({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            name: '',
            code: '',
            description: '',
            department: '',
            semester: '',
            credits: '',
            regulation: '',
            units: [{ title: '', content: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "units",
    });

    const onSubmit = async (values: CourseFormValues) => {
        try {
            await createCourse.mutateAsync({
                name: values.name,
                code: values.code,
                description: values.description,
                department: values.department,
                semester: parseInt(values.semester),
                credits: parseInt(values.credits),
                regulation: values.regulation,
                units: values.units,
            });
            toast.success('Subject/Course created successfully');
            form.reset();
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create subject');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="hero">
                    <BookPlus className="h-4 w-4" />
                    Add Subject
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Subject (Course)</DialogTitle>
                    <DialogDescription>Create a new subject and add its syllabus.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Course Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Data Structures" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Course Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. R231101" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {DEPARTMENTS.map((dept) => (
                                                    <SelectItem key={dept.value} value={dept.value}>
                                                        {dept.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="regulation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Regulation</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select regulation" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {REGULATIONS.map((reg) => (
                                                    <SelectItem key={reg.value} value={reg.value}>
                                                        {reg.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="semester"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Semester</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select semester" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                                    <SelectItem key={sem} value={sem.toString()}>
                                                        Semester {sem}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="credits"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Credits</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g. 3" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Brief description of the course..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-lg font-semibold">Syllabus Units</FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ title: '', content: '' })}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Unit
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="space-y-2 p-3 border rounded-md bg-background">
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Unit {index + 1}</FormLabel>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive h-8 w-8"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name={`units.${index}.title`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder={`Unit ${index + 1} Title`} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`units.${index}.content`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Unit content description..."
                                                        className="min-h-[80px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createCourse.isPending}>
                                {createCourse.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Create Subject
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
