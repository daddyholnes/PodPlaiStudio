import { useState } from 'react';

type Project = {
  id: string;
  name: string;
  description: string;
  lastModified: Date;
};

export default function BuildPage() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'My First Project',
      description: 'A simple project to test the Gemini API',
      lastModified: new Date(Date.now() - 86400000) // yesterday
    },
    {
      id: '2',
      name: 'Image Recognition Demo',
      description: 'Using Gemini Vision for image analysis',
      lastModified: new Date(Date.now() - 172800000) // 2 days ago
    }
  ]);
  
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProjectName.trim()) return;
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDescription,
      lastModified: new Date()
    };
    
    setProjects([newProject, ...projects]);
    setShowNewProjectModal(false);
    setNewProjectName('');
    setNewProjectDescription('');
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          New Project
        </button>
      </div>
      
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => (
            <div 
              key={project.id}
              className="border rounded-md p-4 bg-card hover:shadow-md transition-shadow cursor-pointer"
            >
              <h2 className="text-xl font-semibold mb-1">{project.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Last modified: {formatDate(project.lastModified)}
                </span>
                <button className="text-sm text-primary hover:underline">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet</p>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Create your first project
          </button>
        </div>
      )}
      
      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium mb-1">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="projectDescription" className="block text-sm font-medium mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="projectDescription"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background h-24"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}