// Mock-prefixed names are exempt from Jest's factory hoisting scope restriction.
// They are defined here and safely referenced inside the jest.mock factory below.
const mockGetAllToDo = jest.fn()
const mockCreateToDo = jest.fn()
const mockUpdateToDo = jest.fn()
const mockDeleteToDo = jest.fn()
const mockGenerateUploadUrl = jest.fn()
const mockSetAttachmentUrl = jest.fn()

jest.mock('../../dataLayer/ToDoAccess', () => ({
  ToDoAccess: jest.fn().mockImplementation(() => ({
    getAllToDo: mockGetAllToDo,
    createToDo: mockCreateToDo,
    updateToDo: mockUpdateToDo,
    deleteToDo: mockDeleteToDo,
    generateUploadUrl: mockGenerateUploadUrl,
    setAttachmentUrl: mockSetAttachmentUrl,
  })),
}))

jest.mock('uuid', () => ({ v4: () => 'mock-todo-id' }))

import {
  getAllToDo,
  createToDo,
  updateToDo,
  deleteToDo,
  generateUploadUrl,
} from '../../businessLogic/ToDo'
import { TodoItem } from '../../models/TodoItem'
import { TodoUpdate } from '../../models/TodoUpdate'

const BUCKET = 'test-bucket'
const USER_ID = 'user-abc'

beforeAll(() => {
  process.env.S3_BUCKET_NAME = BUCKET
})

// ─── createToDo ──────────────────────────────────────────────────────────────

describe('createToDo', () => {
  const request = { name: 'Buy milk', dueDate: '2024-01-01' }

  it('does not set attachmentUrl on the item it builds', async () => {
    mockCreateToDo.mockResolvedValue({} as TodoItem)

    await createToDo(request, USER_ID)

    const itemArg: TodoItem = mockCreateToDo.mock.calls[0][0]
    expect(itemArg).not.toHaveProperty('attachmentUrl')
  })

  it('passes userId directly to the data layer without JWT parsing', async () => {
    mockCreateToDo.mockResolvedValue({} as TodoItem)

    await createToDo(request, USER_ID)

    const itemArg: TodoItem = mockCreateToDo.mock.calls[0][0]
    expect(itemArg.userId).toBe(USER_ID)
  })

  it('builds item with deterministic fields', async () => {
    const expectedItem = expect.objectContaining({
      userId: USER_ID,
      todoId: 'mock-todo-id',
      name: 'Buy milk',
      dueDate: '2024-01-01',
      done: false,
    })
    mockCreateToDo.mockResolvedValue({} as TodoItem)

    await createToDo(request, USER_ID)

    expect(mockCreateToDo).toHaveBeenCalledWith(expectedItem)
  })
})

// ─── generateUploadUrl ───────────────────────────────────────────────────────

describe('generateUploadUrl', () => {
  const PRESIGNED = 'https://test-bucket.s3.amazonaws.com/t1?X-Amz-Signature=abc123'
  const PERMANENT = `https://${BUCKET}.s3.amazonaws.com/t1`

  beforeEach(() => {
    mockGenerateUploadUrl.mockResolvedValue(PRESIGNED)
    mockSetAttachmentUrl.mockResolvedValue(undefined)
  })

  it('returns the presigned URL from the data layer, not the permanent S3 URL', async () => {
    const result = await generateUploadUrl('t1', USER_ID)

    expect(result).toBe(PRESIGNED)
    expect(result).not.toBe(PERMANENT)
  })

  it('calls setAttachmentUrl with the permanent S3 URL', async () => {
    await generateUploadUrl('t1', USER_ID)

    expect(mockSetAttachmentUrl).toHaveBeenCalledWith('t1', USER_ID, PERMANENT)
  })

  it('passes userId to setAttachmentUrl without JWT parsing', async () => {
    await generateUploadUrl('t1', USER_ID)

    const [, userIdArg] = mockSetAttachmentUrl.mock.calls[0]
    expect(userIdArg).toBe(USER_ID)
  })

  it('calls generateUploadUrl on the data layer before setAttachmentUrl', async () => {
    const callOrder: string[] = []
    mockGenerateUploadUrl.mockImplementation(async () => {
      callOrder.push('generateUploadUrl')
      return PRESIGNED
    })
    mockSetAttachmentUrl.mockImplementation(async () => {
      callOrder.push('setAttachmentUrl')
    })

    await generateUploadUrl('t1', USER_ID)

    expect(callOrder).toEqual(['generateUploadUrl', 'setAttachmentUrl'])
  })
})

// ─── getAllToDo ───────────────────────────────────────────────────────────────

describe('getAllToDo', () => {
  it('passes userId directly to the data layer', async () => {
    mockGetAllToDo.mockResolvedValue([])

    await getAllToDo(USER_ID)

    expect(mockGetAllToDo).toHaveBeenCalledWith(USER_ID)
    expect(mockGetAllToDo).toHaveBeenCalledTimes(1)
  })
})

// ─── updateToDo ──────────────────────────────────────────────────────────────

describe('updateToDo', () => {
  const update = { name: 'Updated', dueDate: '2024-06-01', done: true }

  it('passes todoId and userId directly to the data layer', async () => {
    mockUpdateToDo.mockResolvedValue({} as TodoUpdate)

    await updateToDo(update, 't1', USER_ID)

    expect(mockUpdateToDo).toHaveBeenCalledWith(update, 't1', USER_ID)
  })
})

// ─── deleteToDo ──────────────────────────────────────────────────────────────

describe('deleteToDo', () => {
  it('passes todoId and userId directly to the data layer', async () => {
    mockDeleteToDo.mockResolvedValue('')

    await deleteToDo('t1', USER_ID)

    expect(mockDeleteToDo).toHaveBeenCalledWith('t1', USER_ID)
  })
})
