import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateUser } from '@/hooks/useLMS';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

const DEPARTMENTS = [
  { value: 'CSE', label: 'CSE' },
  { value: 'AI&DS', label: 'AI&DS' },
  { value: 'EEE', label: 'EEE' },
  { value: 'ECE', label: 'ECE' },
  { value: 'MECH', label: 'MECH' },
  { value: 'CIVIL', label: 'CIVIL' },
  { value: 'IT', label: 'IT' },
];

const SEMESTERS = [
  { value: '1-1', label: '1-1' },
  { value: '1-2', label: '1-2' },
  { value: '2-1', label: '2-1' },
  { value: '2-2', label: '2-2' },
  { value: '3-1', label: '3-1' },
  { value: '3-2', label: '3-2' },
  { value: '4-1', label: '4-1' },
  { value: '4-2', label: '4-2' },
];

const YEARS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
];

const SECTIONS = [
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
  { value: 'D', label: 'Section D' },
  { value: 'E', label: 'Section E' },
];

const REGULATIONS = [
  { value: 'R20', label: 'R20' },
  { value: 'R23', label: 'R23' },
];

const userSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'teacher', 'admin']),
  department: z.string().optional(),
  semester: z.string().optional(),
  year: z.string().optional(),
  section: z.string().optional(),
  regulation: z.string().optional(),
  subject: z.string().optional(),
  phone: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const createUser = useCreateUser();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'student',
      department: '',
      semester: '',
      year: '',
      section: '',
      regulation: '',
      subject: '',
      phone: '',
    },
  });

  const watchRole = form.watch('role');

  const onSubmit = async (values: UserFormValues) => {
    try {
      await createUser.mutateAsync({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        role: values.role,
        department: values.department,
        semester: values.role === 'student' ? values.semester : undefined,
        year: values.role === 'student' && values.year ? parseInt(values.year) : undefined,
        section: values.role === 'student' ? values.section : undefined,
        regulation: values.role === 'student' ? values.regulation : undefined,
        subject: values.role === 'teacher' ? values.subject : undefined,
        phone: values.phone,
      });
      toast.success('User created successfully');
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user profile in the system</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] p-6 pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter initial password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Faculty</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      <SelectContent className="bg-background border z-50">
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
              {watchRole === 'teacher' && (
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter subject" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {watchRole === 'student' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border z-50">
                              {YEARS.map((y) => (
                                <SelectItem key={y.value} value={y.value}>
                                  {y.label}
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
                      name="semester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sem" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border z-50">
                              {SEMESTERS.map((sem) => (
                                <SelectItem key={sem.value} value={sem.value}>
                                  {sem.label}
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
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sec" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border z-50">
                              {SECTIONS.map((sec) => (
                                <SelectItem key={sec.value} value={sec.value}>
                                  {sec.label}
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
                                <SelectValue placeholder="Reg" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border z-50">
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
                </div>
              )}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create User
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
