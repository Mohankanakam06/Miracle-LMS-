import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useUploadMaterial, useMaterials, useCourses } from '@/hooks/useLMS';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, FileText, Video, Link, Trash2, Loader2, CheckCircle, File
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UploadContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadFile, isUploading } = useFileUpload();
  const uploadMaterial = useUploadMaterial();
  const { data: materials, isLoading: materialsLoading } = useMaterials();
  const { data: courses } = useCourses();
  
  const [uploadType, setUploadType] = useState<'pdf' | 'video' | 'link'>('pdf');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!user || !title.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide a title for the material',
        variant: 'destructive',
      });
      return;
    }

    try {
      let fileUrl: string | undefined;
      let externalLink: string | undefined;

      if (uploadType === 'pdf' && selectedFile) {
        const result = await uploadFile(selectedFile, 'materials');
        if (result) {
          fileUrl = result.url;
        } else {
          throw new Error('Failed to upload file');
        }
      } else if (uploadType === 'video' || uploadType === 'link') {
        if (!videoLink.trim()) {
          toast({
            title: 'Missing link',
            description: 'Please provide a valid URL',
            variant: 'destructive',
          });
          return;
        }
        externalLink = videoLink;
      }

      await uploadMaterial.mutateAsync({
        title,
        description,
        type: uploadType,
        fileUrl,
        externalLink,
        uploadedBy: user.id,
      });

      toast({
        title: 'Material uploaded!',
        description: 'Your content has been successfully uploaded',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setVideoLink('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your content',
        variant: 'destructive',
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5 text-destructive" />;
      case 'video': return <Video className="h-5 w-5 text-info" />;
      default: return <Link className="h-5 w-5 text-success" />;
    }
  };

  const recentMaterials = materials?.slice(0, 5) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Upload Content</h1>
          <p className="text-muted-foreground">Share study materials with your students</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload New Material
                </CardTitle>
                <CardDescription>Add PDFs, videos, or reference links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content Type */}
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['pdf', 'video', 'link'] as const).map((type) => (
                      <Button
                        key={type}
                        variant={uploadType === type ? 'default' : 'outline'}
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setUploadType(type)}
                      >
                        {type === 'pdf' && <FileText className={cn("h-6 w-6", uploadType !== 'pdf' && "text-destructive")} />}
                        {type === 'video' && <Video className={cn("h-6 w-6", uploadType !== 'video' && "text-info")} />}
                        {type === 'link' && <Link className={cn("h-6 w-6", uploadType !== 'link' && "text-success")} />}
                        <span className="capitalize">{type === 'pdf' ? 'PDF Notes' : type === 'video' ? 'Video Link' : 'Reference'}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter material title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add a brief description..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Upload/Link */}
                {uploadType === 'pdf' ? (
                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div 
                      className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {selectedFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <CheckCircle className="h-8 w-8 text-success" />
                          <div>
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                          <p className="font-medium">Click to select a file</p>
                          <p className="text-sm text-muted-foreground mt-1">PDF, DOC, PPT (max 10MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="link">
                      {uploadType === 'video' ? 'YouTube Video URL' : 'Reference URL'}
                    </Label>
                    <Input
                      id="link"
                      type="url"
                      placeholder={uploadType === 'video' ? 'https://youtube.com/watch?v=...' : 'https://example.com/resource'}
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                    />
                  </div>
                )}

                <Button 
                  variant="hero" 
                  className="w-full" 
                  size="lg"
                  onClick={handleUpload}
                  disabled={isUploading || uploadMaterial.isPending}
                >
                  {(isUploading || uploadMaterial.isPending) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Material
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Uploads */}
          <div className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-base">Recent Uploads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {materialsLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                ) : recentMaterials.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No materials uploaded yet
                  </p>
                ) : (
                  recentMaterials.map((material) => (
                    <div key={material.id} className="p-3 rounded-lg border hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          material.type === 'pdf' ? "bg-destructive/10" : 
                          material.type === 'video' ? "bg-info/10" : "bg-success/10"
                        )}>
                          {getTypeIcon(material.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{material.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(material.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card bg-info/5 border-info/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">Tips for Uploading</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Use clear, descriptive titles</li>
                  <li>• Keep PDF files under 10MB</li>
                  <li>• Add descriptions for context</li>
                  <li>• Use YouTube for video content</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
