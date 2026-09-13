import { useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';

const SubmissionHistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchSubmissions = async () => {
    if (!problemId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get(`/problem/submittedProblem/${problemId}`);
      setSubmissions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Fetch submissions error:', err);
      if (err.response?.status === 401) {
        setError('Session expired or unauthorized. Please log in again.');
      } else {
        const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to fetch submission history';
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [problemId]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'badge-success';
      case 'wrong':
      case 'wrong answer': return 'badge-error';
      case 'error':
      case 'runtime error':
      case 'compilation error': return 'badge-warning';
      case 'pending': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  const formatMemory = (memory) => {
    if (!memory || isNaN(memory)) return '0 kB';
    if (memory < 1024) return `${memory} kB`;
    return `${(memory / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Submission History</h2>
        <button 
          className={`btn btn-sm btn-outline ${loading ? 'loading' : ''}`}
          onClick={fetchSubmissions}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-48">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-error shadow-lg my-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button 
            className="btn btn-sm btn-outline btn-ghost border border-white/20"
            onClick={fetchSubmissions}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        !Array.isArray(submissions) || submissions.length === 0 ? (
          <div className="alert alert-info shadow-lg">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>No submissions found for this problem</span>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Language</th>
                    <th>Status</th>
                    <th>Runtime</th>
                    <th>Memory</th>
                    <th>Test Cases</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, index) => (
                    <tr key={sub._id || index}>
                      <td>{index + 1}</td>
                      <td className="font-mono">{sub.language || 'N/A'}</td>
                      <td>
                        <span className={`badge ${getStatusColor(sub.status)}`}>
                          {sub.status ? (sub.status.charAt(0).toUpperCase() + sub.status.slice(1)) : 'Unknown'}
                        </span>
                      </td>
                      
                      <td className="font-mono">{sub.runtime !== undefined ? `${sub.runtime}s` : 'N/A'}</td>
                      <td className="font-mono">{formatMemory(sub.memory)}</td>
                      <td className="font-mono">{sub.testCasesPassed ?? 0}/{sub.testCasesTotal ?? 0}</td>
                      <td>{formatDate(sub.createdAt)}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => setSelectedSubmission(sub)}
                        >
                          Code
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Showing {submissions.length} submission{submissions.length === 1 ? '' : 's'}
            </p>
          </>
        )
      )}

      {/* Code View Modal */}
      {selectedSubmission && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl">
            <h3 className="font-bold text-lg mb-4">
              Submission Details: {selectedSubmission.language || 'Code'}
            </h3>
            
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`badge ${getStatusColor(selectedSubmission.status)}`}>
                  {selectedSubmission.status || 'Unknown'}
                </span>
                <span className="badge badge-outline">
                  Runtime: {selectedSubmission.runtime !== undefined ? `${selectedSubmission.runtime}s` : 'N/A'}
                </span>
                <span className="badge badge-outline">
                  Memory: {formatMemory(selectedSubmission.memory)}
                </span>
                <span className="badge badge-outline">
                  Passed: {selectedSubmission.testCasesPassed ?? 0}/{selectedSubmission.testCasesTotal ?? 0}
                </span>
              </div>
              
              {selectedSubmission.errorMessage && (
                <div className="alert alert-error mt-2">
                  <div>
                    <span>{selectedSubmission.errorMessage}</span>
                  </div>
                </div>
              )}
            </div>
            
            <pre className="p-4 bg-gray-900 text-gray-100 rounded overflow-x-auto">
              <code>{selectedSubmission.code || selectedSubmission.source_code || 'No code available'}</code>
            </pre>
            
            <div className="modal-action">
              <button 
                className="btn"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionHistory;