import { mockClient } from 'aws-sdk-client-mock'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ToDoAccess } from '../../dataLayer/ToDoAccess'
import { TodoItem } from '../../models/TodoItem'
import { TodoUpdate } from '../../models/TodoUpdate'

jest.mock('@aws-sdk/s3-request-presigner')

const ddbMock = mockClient(DynamoDBDocumentClient)
const mockGetSignedUrl = getSignedUrl as jest.Mock

const TABLE = 'test-todos-table'
const BUCKET = 'test-bucket'

beforeAll(() => {
  process.env.TODOS_TABLE = TABLE
  process.env.S3_BUCKET_NAME = BUCKET
})

beforeEach(() => {
  ddbMock.reset()
})

// ─── getAllToDo ───────────────────────────────────────────────────────────────

describe('getAllToDo', () => {
  it('returns items from DynamoDB', async () => {
    const items: TodoItem[] = [
      {
        userId: 'u1',
        todoId: 't1',
        name: 'Buy milk',
        dueDate: '2024-01-01',
        createdAt: '1000',
        done: false,
      },
    ]
    ddbMock.on(QueryCommand).resolves({ Items: items })

    const access = new ToDoAccess()
    const result = await access.getAllToDo('u1')

    expect(result).toEqual(items)
  })

  it('queries with the correct userId key condition', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [] })

    const access = new ToDoAccess()
    await access.getAllToDo('user-abc')

    const calls = ddbMock.commandCalls(QueryCommand)
    expect(calls).toHaveLength(1)
    const input = calls[0].args[0].input
    expect(input.TableName).toBe(TABLE)
    expect(input.ExpressionAttributeValues).toMatchObject({ ':userId': 'user-abc' })
  })
})

// ─── createToDo ──────────────────────────────────────────────────────────────

describe('createToDo', () => {
  it('sends PutCommand with the full item and returns it', async () => {
    const item: TodoItem = {
      userId: 'u1',
      todoId: 't1',
      name: 'Buy milk',
      dueDate: '2024-01-01',
      createdAt: '1000',
      done: false,
    }
    ddbMock.on(PutCommand).resolves({})

    const access = new ToDoAccess()
    const result = await access.createToDo(item)

    expect(result).toEqual(item)

    const calls = ddbMock.commandCalls(PutCommand)
    expect(calls).toHaveLength(1)
    expect(calls[0].args[0].input).toEqual({ TableName: TABLE, Item: item })
  })
})

// ─── updateToDo ──────────────────────────────────────────────────────────────

describe('updateToDo', () => {
  const update: TodoUpdate = { name: 'Updated', dueDate: '2024-06-01', done: true }

  it('sends UpdateCommand and returns the updated attributes', async () => {
    ddbMock.on(UpdateCommand).resolves({ Attributes: update })

    const access = new ToDoAccess()
    const result = await access.updateToDo(update, 't1', 'u1')

    expect(result).toEqual(update)

    const calls = ddbMock.commandCalls(UpdateCommand)
    expect(calls).toHaveLength(1)
    const input = calls[0].args[0].input
    expect(input.TableName).toBe(TABLE)
    expect(input.Key).toEqual({ userId: 'u1', todoId: 't1' })
    expect(input.ConditionExpression).toBe('attribute_exists(todoId)')
  })

  it('propagates ConditionalCheckFailedException when item does not exist', async () => {
    ddbMock.on(UpdateCommand).rejects(
      new ConditionalCheckFailedException({ message: 'The conditional request failed', $metadata: {} })
    )

    const access = new ToDoAccess()
    await expect(access.updateToDo(update, 'missing', 'u1')).rejects.toMatchObject({
      name: 'ConditionalCheckFailedException',
    })
  })
})

// ─── deleteToDo ──────────────────────────────────────────────────────────────

describe('deleteToDo', () => {
  it('sends DeleteCommand with condition and returns empty string', async () => {
    ddbMock.on(DeleteCommand).resolves({})

    const access = new ToDoAccess()
    const result = await access.deleteToDo('t1', 'u1')

    expect(result).toBe('')

    const calls = ddbMock.commandCalls(DeleteCommand)
    expect(calls).toHaveLength(1)
    const input = calls[0].args[0].input
    expect(input.TableName).toBe(TABLE)
    expect(input.Key).toEqual({ userId: 'u1', todoId: 't1' })
    expect(input.ConditionExpression).toBe('attribute_exists(todoId)')
  })

  it('propagates ConditionalCheckFailedException when item does not exist', async () => {
    ddbMock.on(DeleteCommand).rejects(
      new ConditionalCheckFailedException({ message: 'The conditional request failed', $metadata: {} })
    )

    const access = new ToDoAccess()
    await expect(access.deleteToDo('missing', 'u1')).rejects.toMatchObject({
      name: 'ConditionalCheckFailedException',
    })
  })
})

// ─── setAttachmentUrl ─────────────────────────────────────────────────────────

describe('setAttachmentUrl', () => {
  it('sends UpdateCommand setting only attachmentUrl', async () => {
    ddbMock.on(UpdateCommand).resolves({})

    const access = new ToDoAccess()
    await access.setAttachmentUrl('t1', 'u1', 'https://example.com/t1')

    const calls = ddbMock.commandCalls(UpdateCommand)
    expect(calls).toHaveLength(1)
    const input = calls[0].args[0].input
    expect(input.TableName).toBe(TABLE)
    expect(input.Key).toEqual({ userId: 'u1', todoId: 't1' })
    expect(input.UpdateExpression).toBe('set attachmentUrl = :url')
    expect(input.ConditionExpression).toBe('attribute_exists(todoId)')
    expect(input.ExpressionAttributeValues).toEqual({ ':url': 'https://example.com/t1' })
    // Must not contain ExpressionAttributeNames — updateToDo uses aliases for
    // reserved-word columns; setAttachmentUrl must only set attachmentUrl
    expect(input).not.toHaveProperty('ExpressionAttributeNames')
  })
})

// ─── generateUploadUrl ───────────────────────────────────────────────────────

describe('generateUploadUrl', () => {
  it('returns the presigned URL from getSignedUrl', async () => {
    const presigned = 'https://test-bucket.s3.amazonaws.com/t1?X-Amz-Signature=abc'
    mockGetSignedUrl.mockResolvedValue(presigned)

    const access = new ToDoAccess()
    const result = await access.generateUploadUrl('t1')

    expect(result).toBe(presigned)
  })

  it('calls getSignedUrl with a PutObjectCommand for the right bucket and key', async () => {
    mockGetSignedUrl.mockResolvedValue('https://fake-url')

    const access = new ToDoAccess()
    await access.generateUploadUrl('t1')

    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1)
    const [, commandArg, optionsArg] = mockGetSignedUrl.mock.calls[0]
    expect(commandArg.input).toEqual({ Bucket: BUCKET, Key: 't1' })
    expect(optionsArg).toEqual({ expiresIn: 1000 })
  })
})
