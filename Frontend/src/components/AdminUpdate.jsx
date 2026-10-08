import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { NavLink } from 'react-router';
import { ArrowLeft, Edit3, Search } from 'lucide-react';

const AdminUpdate = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch problems. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = problem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.tags?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' ||
      problem.difficulty?.toLowerCase() === filterDifficulty.toLowerCase();
    return matchesSearch && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Top Navigation */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <NavLink to="/admin" className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft size={18} />
            Admin Panel
          </NavLink>
          <h1 className="text-3xl font-bold">Update Problems</h1>
          <span className="badge badge-primary">{problems.length} total</span>
        </div>
        <NavLink to="/admin/create" className="btn btn-primary btn-sm">
          + Create New Problem
        </NavLink>
      </div>

      {error && (
        <div className="alert alert-error shadow-lg mb-6">
          <div className="flex justify-between items-center w-full">
            <span>{error}</span>
            <button onClick={fetchProblems} className="btn btn-sm btn-outline">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="card bg-base-100 shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={18} />
            <input
              type="text"
              placeholder="Search problem title or tags..."
              className="input input-bordered w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              className="select select-bordered"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Problems Table */}
      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200">
              <tr>
                <th className="w-1/12">#</th>
                <th className="w-5/12">Title</th>
                <th className="w-2/12">Difficulty</th>
                <th className="w-2/12">Tags</th>
                <th className="w-2/12 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-base-content/60">
                    No problems match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProblems.map((problem, index) => {
                  const diff = problem.difficulty?.toLowerCase();
                  return (
                    <tr key={problem._id} className="hover">
                      <th className="font-mono">{index + 1}</th>
                      <td className="font-medium text-base">
                        <NavLink
                          to={`/problem/${problem._id}`}
                          className="hover:underline hover:text-primary"
                        >
                          {problem.title}
                        </NavLink>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            diff === 'easy'
                              ? 'badge-success'
                              : diff === 'medium'
                              ? 'badge-warning'
                              : 'badge-error'
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-outline">
                          {problem.tags}
                        </span>
                      </td>
                      <td className="text-center">
                        <NavLink
                          to={`/admin/update/${problem._id}`}
                          className="btn btn-sm btn-warning gap-1.5"
                        >
                          <Edit3 size={15} />
                          Edit
                        </NavLink>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUpdate;
