/**
 * Candidates service for API interactions.
 */
import { ApiService } from '@/services/ApiService';
import type {
  Candidate,
  CandidateListParams,
  CandidateListResponse,
  CreateCandidatePayload,
  UpdateCandidatePayload,
  BulkCreateCandidatesPayload,
  BulkCreateCandidatesResponse,
} from '@/@types/candidate';

/**
 * CandidatesService provides methods for candidate CRUD operations.
 */
export const CandidatesService = {
  /**
   * Fetches a paginated list of candidates.
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of candidates
   */
  async list(params?: CandidateListParams): Promise<CandidateListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.pageSize !== undefined) queryParams.pageSize = String(params.pageSize);
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.organizationId) queryParams.organizationId = params.organizationId;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await ApiService.get<CandidateListResponse>('candidates.list', {
      params: queryParams,
    });

    // Normalize backend response to expected frontend shape
    const raw = response.data as unknown as Record<string, unknown>;
    if (raw && Array.isArray(raw.candidates) && !Array.isArray(raw.data)) {
      return {
        data: raw.candidates as Candidate[],
        meta: {
          page: (raw.page as number) || 1,
          pageSize: (raw.limit as number) || (params?.pageSize ?? 10),
          totalItems: (raw.total as number) || 0,
          totalPages: (raw.totalPages as number) || 1,
        },
      };
    }

    return response.data;
  },

  /**
   * Fetches a single candidate by ID.
   * @param id - Candidate ID
   * @returns Candidate details
   */
  async get(id: string): Promise<Candidate> {
    const response = await ApiService.get<Candidate>('candidates.get', {
      pathParams: { id },
    });
    return response.data;
  },

  /**
   * Creates a new candidate.
   * @param payload - Candidate data
   * @returns Created candidate
   */
  async create(payload: CreateCandidatePayload): Promise<Candidate> {
    const response = await ApiService.post<Candidate, CreateCandidatePayload>(
      'candidates.create',
      payload
    );
    return response.data;
  },

  /**
   * Updates an existing candidate.
   * @param id - Candidate ID
   * @param payload - Updated candidate data
   * @returns Updated candidate
   */
  async update(id: string, payload: UpdateCandidatePayload): Promise<Candidate> {
    const response = await ApiService.patch<Candidate, UpdateCandidatePayload>(
      'candidates.update',
      payload,
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Deletes a candidate.
   * @param id - Candidate ID
   */
  async delete(id: string): Promise<void> {
    await ApiService.delete('candidates.delete', {
      pathParams: { id },
    });
  },

  /**
   * Bulk creates multiple candidates.
   * @param payload - Bulk creation payload with candidates array
   * @returns Bulk creation result with success/failure details
   */
  async bulkCreate(payload: BulkCreateCandidatesPayload): Promise<BulkCreateCandidatesResponse> {
    const response = await ApiService.post<BulkCreateCandidatesResponse, BulkCreateCandidatesPayload>(
      'candidates.bulkCreate',
      payload
    );
    return response.data;
  },
};
