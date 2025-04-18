
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AvatarUploadProps {
  avatarUrl: string | null;
  userId: string;
  username: string;
  onAvatarUpdate: (url: string) => void;
}

export const AvatarUpload = ({ avatarUrl, userId, username, onAvatarUpdate }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const { toast } = useToast();

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      if (!userId) {
        throw new Error("User ID is required");
      }

      // Generate a unique file name using the user ID
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload the file to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update the user's avatar_url in the profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      // Call the onAvatarUpdate callback
      onAvatarUpdate(publicUrl);
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your avatar.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    const fileSize = file.size / 1024 / 1024; // Convert to MB
    
    if (fileSize > 2) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create a preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      
      // Upload the file
      await uploadAvatar(file);
    } catch (error: any) {
      console.error('Error handling file:', error);
      setPreview(avatarUrl); // Reset preview on error
      
      // Display a more specific error message based on the error
      let errorMessage = "There was an error uploading your avatar.";
      if (error.statusCode === "403") {
        errorMessage = "Permission denied. Please try logging in again.";
      } else if (error.message?.includes("storage")) {
        errorMessage = "Storage error. Please try a different image format.";
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const removeAvatar = async () => {
    try {
      if (!preview || !userId) return;
      
      setUploading(true);
      
      // Only attempt to delete from storage if it's a Supabase URL
      if (avatarUrl && avatarUrl.includes('supabase')) {
        try {
          // Extract filename from URL
          const urlParts = avatarUrl.split('/');
          const fileName = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1];
          
          // Delete from storage
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([fileName]);
            
          if (deleteError) {
            console.error('Error deleting avatar from storage:', deleteError);
          }
        } catch (err) {
          console.error('Error parsing avatar URL for deletion:', err);
          // Continue with profile update even if storage deletion fails
        }
      }
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update state
      setPreview(null);
      onAvatarUpdate("");
      
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Error",
        description: "There was an error removing your avatar.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="group relative cursor-pointer" onClick={() => preview ? removeAvatar() : document.getElementById('avatar-upload')?.click()}>
          <Avatar className="h-28 w-28 border-2 border-white/20">
            <AvatarImage src={preview || ""} />
            <AvatarFallback className="bg-black/40">
              <User className="h-14 w-14 text-white/60" />
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            {preview ? (
              <span className="text-white text-xs">Click to remove</span>
            ) : (
              <Camera className="h-8 w-8 text-white" />
            )}
          </div>
        </div>
        
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
          <input 
            type="file"
            id="avatar-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept="image/*"
            disabled={uploading}
          />
          <label 
            htmlFor="avatar-upload" 
            className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-purple-500 hover:bg-purple-600 cursor-pointer transition-colors"
          >
            <Camera className="h-4 w-4 text-white" />
          </label>
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mt-4">
          {username || "User"}
        </h2>
      </div>
      
      {uploading && (
        <div className="text-center text-sm text-white/60">
          Uploading...
        </div>
      )}
    </div>
  );
};
