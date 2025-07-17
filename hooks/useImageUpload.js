import { useState, useRef } from 'react';


export default function useImageUpload () {
    const [dragActive, setDragActive] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const fileInputRef = useRef(null);
    
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true);
        } else if (e.type === "dragleave") {
          setDragActive(false);
        }
      };
    
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const newFiles = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
          );
          
          if (imageFiles.length + newFiles.length > 5) {
            alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
            return;
          }
          
          setImageFiles(prev => [...prev, ...newFiles]);
        }
      };
    
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
          const newFiles = Array.from(e.target.files).filter(file => 
            file.type.startsWith('image/')
          );
          
          if (imageFiles.length + newFiles.length > 5) {
            alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
            return;
          }
          
          setImageFiles(prev => [...prev, ...newFiles]);
        }
      };



    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const moveImage = (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= imageFiles.length) return;
        
        const newImages = [...imageFiles];
        const [movedImage] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, movedImage);
        setImageFiles(newImages);
    };


    return {
        handleDrag,
        handleDrop,
        // handleSaveUsernameAndProfile,
        fileInputRef,
        dragActive,
        imageFiles,
        removeImage,
        moveImage,
        handleFileSelect,
        setImageFiles,
        setDragActive
    }
}