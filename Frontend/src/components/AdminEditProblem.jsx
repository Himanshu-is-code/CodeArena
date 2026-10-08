import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate, NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

const defaultLanguages = ['C++', 'Java', 'JavaScript'];

function AdminEditProblem() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'easy',
      tags: 'array',
      visibleTestCases: [{ input: '', output: '', explanation: '' }],
      hiddenTestCases: [{ input: '', output: '' }],
      startCode: defaultLanguages.map(lang => ({ language: lang, initialCode: '' })),
      referenceSolution: defaultLanguages.map(lang => ({ language: lang, completeCode: '' }))
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        setServerError(null);
        const { data } = await axiosClient.get(`/problem/problemById/${problemId}`);

        // Normalize difficulty
        const diff = data.difficulty?.toLowerCase();
        const validDifficulty = ['easy', 'medium', 'hard'].includes(diff) ? diff : 'easy';

        // Normalize tag
        const tag = (data.tags === 'linkedlist' || data.tags === 'linkedList') ? 'linkedList' : (data.tags?.toLowerCase() || 'array');
        const validTag = ['array', 'linkedList', 'graph', 'dp'].includes(tag) ? tag : 'array';

        // Normalize startCode
        const startCode = defaultLanguages.map(lang => {
          const existing = data.startCode?.find(
            sc => sc.language?.toLowerCase() === lang.toLowerCase() ||
              (lang === 'C++' && sc.language?.toLowerCase() === 'cpp')
          );
          return { language: lang, initialCode: existing?.initialCode || '' };
        });

        // Normalize referenceSolution
        const referenceSolution = defaultLanguages.map(lang => {
          const existing = data.referenceSolution?.find(
            rs => rs.language?.toLowerCase() === lang.toLowerCase() ||
              (lang === 'C++' && rs.language?.toLowerCase() === 'cpp')
          );
          return { language: lang, completeCode: existing?.completeCode || '' };
        });

        // Normalize visible test cases
        const visibleTestCases = data.visibleTestCases && data.visibleTestCases.length > 0
          ? data.visibleTestCases.map(tc => ({
              input: tc.input || '',
              output: tc.output || '',
              explanation: tc.explanation || ''
            }))
          : [{ input: '', output: '', explanation: '' }];

        // Normalize hidden test cases
        const hiddenTestCases = data.hiddenTestCases && data.hiddenTestCases.length > 0
          ? data.hiddenTestCases.map(tc => ({
              input: tc.input || '',
              output: tc.output || ''
            }))
          : [{ input: '', output: '' }];

        reset({
          title: data.title || '',
          description: data.description || '',
          difficulty: validDifficulty,
          tags: validTag,
          visibleTestCases,
          hiddenTestCases,
          startCode,
          referenceSolution
        });
      } catch (err) {
        console.error('Error fetching problem for edit:', err);
        setServerError(err.response?.data?.message || err.response?.data || 'Failed to load problem details.');
      } finally {
        setLoading(false);
      }
    };

    if (problemId) {
      fetchProblem();
    }
  }, [problemId, reset]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setServerError(null);
      setSuccessMessage(null);

      await axiosClient.put(`/problem/update/${problemId}`, data);
      setSuccessMessage('Problem updated successfully!');
      setTimeout(() => {
        navigate('/admin/update');
      }, 1200);
    } catch (err) {
      console.error('Error updating problem:', err);
      const errMsg = err.response?.data?.message || err.response?.data || err.message || 'Failed to update problem';
      setServerError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-warning"></span>
          <p className="text-base-content/70">Loading problem details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header & Back Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <NavLink to="/admin/update" className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft size={18} />
            Back to Problems List
          </NavLink>
          <h1 className="text-3xl font-bold">Edit Problem</h1>
        </div>
        <NavLink to={`/problem/${problemId}`} target="_blank" className="btn btn-outline btn-sm">
          View Live Problem
        </NavLink>
      </div>

      {serverError && (
        <div className="alert alert-error shadow-lg mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{serverError}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success shadow-lg mb-6">
          <span>{successMessage} Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-warning">Basic Information</h2>
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Title</span>
              </label>
              <input
                {...register('title')}
                placeholder="Problem Title"
                className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
              />
              {errors.title && (
                <span className="text-error text-sm mt-1">{errors.title.message}</span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              <textarea
                {...register('description')}
                placeholder="Problem description and specifications..."
                className={`textarea textarea-bordered h-40 w-full ${errors.description ? 'textarea-error' : ''}`}
              />
              {errors.description && (
                <span className="text-error text-sm mt-1">{errors.description.message}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Difficulty</span>
                </label>
                <select
                  {...register('difficulty')}
                  className={`select select-bordered w-full ${errors.difficulty ? 'select-error' : ''}`}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                {errors.difficulty && (
                  <span className="text-error text-sm mt-1">{errors.difficulty.message}</span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Tag</span>
                </label>
                <select
                  {...register('tags')}
                  className={`select select-bordered w-full ${errors.tags ? 'select-error' : ''}`}
                >
                  <option value="array">Array</option>
                  <option value="linkedList">Linked List</option>
                  <option value="graph">Graph</option>
                  <option value="dp">DP</option>
                </select>
                {errors.tags && (
                  <span className="text-error text-sm mt-1">{errors.tags.message}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Visible Test Cases */}
        <div className="card bg-base-100 shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-warning">Visible Test Cases</h2>
              <p className="text-sm text-base-content/60">Test cases shown directly to users on the problem page</p>
            </div>
            <button
              type="button"
              onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
              className="btn btn-sm btn-outline btn-primary"
            >
              + Add Visible Case
            </button>
          </div>

          {errors.visibleTestCases?.root && (
            <p className="text-error text-sm mb-3">{errors.visibleTestCases.root.message}</p>
          )}

          <div className="space-y-4">
            {visibleFields.map((field, index) => (
              <div key={field.id} className="border border-base-300 rounded-lg p-4 space-y-3 bg-base-200/50">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">Visible Case #{index + 1}</span>
                  {visibleFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVisible(index)}
                      className="btn btn-xs btn-error btn-outline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs text-base-content/70">Input</label>
                  <input
                    {...register(`visibleTestCases.${index}.input`)}
                    placeholder="e.g. [2,7,11,15], target = 9"
                    className="input input-bordered input-sm w-full font-mono mt-1"
                  />
                  {errors.visibleTestCases?.[index]?.input && (
                    <span className="text-error text-xs">{errors.visibleTestCases[index].input.message}</span>
                  )}
                </div>

                <div>
                  <label className="text-xs text-base-content/70">Output</label>
                  <input
                    {...register(`visibleTestCases.${index}.output`)}
                    placeholder="e.g. [0,1]"
                    className="input input-bordered input-sm w-full font-mono mt-1"
                  />
                  {errors.visibleTestCases?.[index]?.output && (
                    <span className="text-error text-xs">{errors.visibleTestCases[index].output.message}</span>
                  )}
                </div>

                <div>
                  <label className="text-xs text-base-content/70">Explanation</label>
                  <textarea
                    {...register(`visibleTestCases.${index}.explanation`)}
                    placeholder="Explain the testcase reasoning..."
                    className="textarea textarea-bordered textarea-sm w-full mt-1"
                    rows={2}
                  />
                  {errors.visibleTestCases?.[index]?.explanation && (
                    <span className="text-error text-xs">{errors.visibleTestCases[index].explanation.message}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hidden Test Cases */}
        <div className="card bg-base-100 shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-warning">Hidden Test Cases</h2>
              <p className="text-sm text-base-content/60">Comprehensive test cases used during final submission judgment</p>
            </div>
            <button
              type="button"
              onClick={() => appendHidden({ input: '', output: '' })}
              className="btn btn-sm btn-outline btn-primary"
            >
              + Add Hidden Case
            </button>
          </div>

          {errors.hiddenTestCases?.root && (
            <p className="text-error text-sm mb-3">{errors.hiddenTestCases.root.message}</p>
          )}

          <div className="space-y-4">
            {hiddenFields.map((field, index) => (
              <div key={field.id} className="border border-base-300 rounded-lg p-4 space-y-3 bg-base-200/50">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">Hidden Case #{index + 1}</span>
                  {hiddenFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHidden(index)}
                      className="btn btn-xs btn-error btn-outline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs text-base-content/70">Input</label>
                  <input
                    {...register(`hiddenTestCases.${index}.input`)}
                    placeholder="Input data"
                    className="input input-bordered input-sm w-full font-mono mt-1"
                  />
                  {errors.hiddenTestCases?.[index]?.input && (
                    <span className="text-error text-xs">{errors.hiddenTestCases[index].input.message}</span>
                  )}
                </div>

                <div>
                  <label className="text-xs text-base-content/70">Expected Output</label>
                  <input
                    {...register(`hiddenTestCases.${index}.output`)}
                    placeholder="Expected output"
                    className="input input-bordered input-sm w-full font-mono mt-1"
                  />
                  {errors.hiddenTestCases?.[index]?.output && (
                    <span className="text-error text-xs">{errors.hiddenTestCases[index].output.message}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Templates & Reference Solutions */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-warning">Code Templates & Solutions</h2>
          <p className="text-sm text-base-content/60 mb-6">
            Ensure reference solutions pass visible test cases, as they are verified automatically.
          </p>

          <div className="space-y-8">
            {defaultLanguages.map((lang, index) => (
              <div key={lang} className="border border-base-300 rounded-xl p-5 bg-base-200/40 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="badge badge-warning badge-sm">{lang}</span>
                  Language Configuration
                </h3>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-medium text-xs">Starter Boilerplate Code</span>
                  </label>
                  <textarea
                    {...register(`startCode.${index}.initialCode`)}
                    rows={6}
                    className="textarea textarea-bordered font-mono text-sm w-full bg-base-300"
                    placeholder={`Starter code for ${lang}...`}
                  />
                  {errors.startCode?.[index]?.initialCode && (
                    <span className="text-error text-xs mt-1">
                      {errors.startCode[index].initialCode.message}
                    </span>
                  )}
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-medium text-xs">Complete Reference Solution</span>
                  </label>
                  <textarea
                    {...register(`referenceSolution.${index}.completeCode`)}
                    rows={8}
                    className="textarea textarea-bordered font-mono text-sm w-full bg-base-300"
                    placeholder={`Complete working solution for ${lang}...`}
                  />
                  {errors.referenceSolution?.[index]?.completeCode && (
                    <span className="text-error text-xs mt-1">
                      {errors.referenceSolution[index].completeCode.message}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit & Cancel Buttons */}
        <div className="flex gap-4">
          <NavLink to="/admin/update" className="btn btn-outline flex-1">
            Cancel
          </NavLink>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-warning flex-1 gap-2"
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Validating & Updating...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminEditProblem;
