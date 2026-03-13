import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit, Trash2, Eye, Calendar, Upload, Image, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BlogManager = ({ token }) => {
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const [posts, setPosts] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    thumbnail: '',
    category: '',
    tags: '',
    published: false
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/blog?published_only=false&limit=100`);
      setPosts(response.data);
    } catch (error) {
      console.error('Fetch posts error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug || !formData.excerpt || !formData.content) {
      toast.error('Başlıq, slug, excerpt və content mütləqdir');
      return;
    }

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      if (editingPost) {
        // Update
        await axios.put(
          `${API_BASE_URL}/api/admin/blog/${editingPost.id}`,
          { ...formData, tags: tagsArray },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Bloq yazısı yeniləndi!');
      } else {
        // Create
        await axios.post(
          `${API_BASE_URL}/api/admin/blog`,
          { ...formData, tags: tagsArray },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Bloq yazısı yaradıldı!');
      }
      
      setIsDialogOpen(false);
      setEditingPost(null);
      resetForm();
      fetchPosts();
    } catch (error) {
      console.error('Save post error:', error);
      toast.error('Əməliyyat uğursuz oldu: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      thumbnail: post.thumbnail || '',
      category: post.category || '',
      tags: post.tags.join(', '),
      published: post.published
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Bu bloq yazısını silmək istədiyinizə əminsiniz?')) return;
    
    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/blog/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Bloq yazısı silindi!');
      fetchPosts();
    } catch (error) {
      console.error('Delete post error:', error);
      toast.error('Silinmə uğursuz oldu');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      thumbnail: '',
      category: '',
      tags: '',
      published: false
    });
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/ə/g, 'e')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Yalnız şəkil faylları qəbul edilir');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fayl ölçüsü 5MB-dan çox olmamalıdır');
      return;
    }

    setIsUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/api/upload/image`,
        uploadFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.url) {
        setFormData({ ...formData, thumbnail: response.data.url });
        toast.success('Şəkil yükləndi!');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Şəkil yüklənərkən xəta: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bloq İdarəsi</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingPost(null);
                  resetForm();
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Yeni Yazı
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPost ? 'Bloq Yazısını Redaktə Et' : 'Yeni Bloq Yazısı'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Başlıq *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setFormData({
                          ...formData,
                          title,
                          slug: formData.slug || generateSlug(title)
                        });
                      }}
                      placeholder="Bloq yazısı başlığı"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug *</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="bloq-yazisi-slug"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Qısa Təsvir *</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Bloq yazısının qısa təsviri..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Məzmun *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Bloq yazısının tam məzmunu..."
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Şəkil URL</Label>
                    <Input
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kateqoriya</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Məsələn: Məsləhətlər"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Teqlər (vergüllə ayrılmış)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="toy, dəvətnamə, dizayn"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="published" className="cursor-pointer">Dərc edilsin</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Ləğv et
                  </Button>
                  <Button onClick={handleSubmit} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    {editingPost ? 'Yenilə' : 'Yarat'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Hələ bloq yazısı yoxdur
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{post.title}</h3>
                      {post.published ? (
                        <Badge className="bg-green-100 text-green-800">Dərc edilib</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Qaralama</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{post.excerpt}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(post.created_at).toLocaleDateString('az-AZ')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.views} baxış</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogManager;