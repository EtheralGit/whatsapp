import { ImageIcon, Plus } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { Dialog, DialogContent, DialogDescription } from "../ui/dialog";
import Image from "next/image";
import { Button } from "../ui/button";
import ReactPlayer from "react-player";
import toast from "react-hot-toast";
import { generatedUploadUrl } from "../../../convex/conversations";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConversationStore } from "@/store/chat-store";

const MediaDropdown = () => {
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const me = useQuery(api.users.getMe);

  const generatedUploadUrl = useMutation(api.conversations.generatedUploadUrl);
  const sendImage = useMutation(api.messages.sendImage);
  const sendVideo = useMutation(api.messages.sendVideo);

  const { selectedConversation } = useConversationStore();

  const handleSendVideo = async () => {
    setIsLoading(true);
    try {
      const postUrl = await generatedUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedVideo!.type },
        body: selectedVideo,
      });

      const { storageId } = await result.json();

      await sendVideo({
        sender: me!._id,
        converastion: selectedConversation!._id,
        videoId: storageId,
      });

      setSelectedVideo(null);
    } catch (error) {
      toast.error("Failed to send video");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendImage = async () => {
    setIsLoading(true);
    try {
      const postUrl = await generatedUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage!.type },
        body: selectedImage,
      });

      const { storageId } = await result.json();

      await sendImage({
        conversation: selectedConversation!._id,
        imgId: storageId,
        sender: me!._id,
      });

      setSelectedImage(null);
    } catch (error) {
      toast.error("Failed to send image");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <input
        type="file"
        ref={imageInput}
        accept="image/"
        onChange={(e) => setSelectedImage(e.target?.files![0])}
        hidden
      />
      <input
        type="file"
        ref={videoInput}
        accept="image/"
        onChange={(e) => setSelectedVideo(e.target?.files![0])}
        hidden
      />

      {selectedImage && (
        <MediaImageDialog
          isOpen={selectedImage !== null}
          onClose={() => setSelectedImage(null)}
          selectedImage={selectedImage}
          isLoading={isLoading}
          handleSendImage={handleSendImage}
        />
      )}

      {selectedVideo && (
        <MediaVideoDialog
          isOpen={selectedVideo !== null}
          onClose={() => setSelectedVideo(null)}
          selectedVideo={selectedVideo}
          isLoading={isLoading}
          handleSendVideo={handleSendVideo}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Plus className="text-gray-600 dark:text-gray-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => imageInput.current!.click()}
            className="cursor-pointer p-2"
          >
            <ImageIcon size={18} className="mr-1 inline" /> Photo
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => videoInput.current!.click()}
            className="cursor-pointer p-2"
          >
            <ImageIcon size={20} className="mr-1 inline" /> Video
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default MediaDropdown;

type MediaImageDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedImage: File;
  isLoading: boolean;
  handleSendImage: () => void;
};

const MediaImageDialog = ({
  isOpen,
  onClose,
  selectedImage,
  isLoading,
  handleSendImage,
}: MediaImageDialogProps) => {
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedImage) return;
    const reader = new FileReader();
    reader.onload = (e) => setRenderedImage(e.target?.result as string);
    reader.readAsDataURL(selectedImage);
  }, [selectedImage]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogDescription className="flex flex-col gap-10 justify-center items-center">
          {renderedImage && (
            <Image
              src={renderedImage}
              width={300}
              height={300}
              alt="selected Image"
            />
          )}
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={() => handleSendImage()}
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

type MediaVideoDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedVideo: File;
  isLoading: boolean;
  handleSendVideo: () => void;
};

const MediaVideoDialog = ({
  isOpen,
  onClose,
  selectedVideo,
  isLoading,
  handleSendVideo,
}: MediaVideoDialogProps) => {
  const renderedVideo = URL.createObjectURL(
    new Blob([selectedVideo], { type: "video/mp4" })
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogDescription className="flex flex-col gap-10 justify-center items-center">
          Video
          <div className="w-full">
            {renderedVideo && (
              <ReactPlayer url={renderedVideo} controls width="100%" />
            )}
          </div>
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={() => handleSendVideo()}
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};
