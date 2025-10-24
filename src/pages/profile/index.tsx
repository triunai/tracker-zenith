import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase/supabase';
import { UpdateProfileData } from '@/interfaces/user-interface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import Layout from '@/components/Layout/Layout';
import PageHeader from '@/components/Layout/PageHeader';

const Profile: React.FC = () => {
  const { user, profile, updateProfile, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<UpdateProfileData>({
    display_name: profile?.display_name || '',
    avatar_url: profile?.avatar_url || '',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile(formData);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
    }
  };
  
  if (!user || !profile) {
    return (
      <Layout>
        <PageHeader title="Profile" showBack={true} />
        <div className="container flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <PageHeader title="Profile" showBack={true} />
      <div className="container py-10 lg:pt-10 pt-20">
        <div className="max-w-md mx-auto">
          <div className="mb-6 lg:block hidden">
            <BackButton />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Profile</CardTitle>
              <CardDescription>View and update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                    />
                    <p className="text-sm text-muted-foreground">
                      Your email cannot be changed
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      name="display_name"
                      type="text"
                      value={formData.display_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="avatar_url">Avatar URL</Label>
                    <Input
                      id="avatar_url"
                      name="avatar_url"
                      type="text"
                      value={formData.avatar_url || ''}
                      onChange={handleChange}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="border-t p-4">
              <div className="text-sm text-muted-foreground">
                Account created on: {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile; 