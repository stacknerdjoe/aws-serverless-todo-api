import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

export class ToDoAccess {
  private readonly docClient: DynamoDBDocumentClient
  private readonly s3Client: S3Client
  private readonly todoTable: string
  private readonly s3BucketName: string

  constructor() {
    this.docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))
    this.s3Client = new S3Client({})
    this.todoTable = process.env.TODOS_TABLE!
    this.s3BucketName = process.env.S3_BUCKET_NAME!
  }

  async getAllToDo(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todo')
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.todoTable,
        KeyConditionExpression: '#userId = :userId',
        ExpressionAttributeNames: { '#userId': 'userId' },
        ExpressionAttributeValues: { ':userId': userId },
      })
    )
    return result.Items as TodoItem[]
  }

  async createToDo(todoItem: TodoItem): Promise<TodoItem> {
    console.log('Creating new todo')
    await this.docClient.send(
      new PutCommand({
        TableName: this.todoTable,
        Item: todoItem,
      })
    )
    return todoItem
  }

  async updateToDo(todoUpdate: TodoUpdate, todoId: string, userId: string): Promise<TodoUpdate> {
    console.log('Updating todo')
    const result = await this.docClient.send(
      new UpdateCommand({
        TableName: this.todoTable,
        Key: { userId, todoId },
        UpdateExpression: 'set #a = :a, #b = :b, #c = :c',
        ConditionExpression: 'attribute_exists(todoId)',
        ExpressionAttributeNames: { '#a': 'name', '#b': 'dueDate', '#c': 'done' },
        ExpressionAttributeValues: {
          ':a': todoUpdate['name'],
          ':b': todoUpdate['dueDate'],
          ':c': todoUpdate['done'],
        },
        ReturnValues: 'ALL_NEW',
      })
    )
    return result.Attributes as TodoUpdate
  }

  async deleteToDo(todoId: string, userId: string): Promise<string> {
    console.log('Deleting todo')
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.todoTable,
        Key: { userId, todoId },
        ConditionExpression: 'attribute_exists(todoId)',
      })
    )
    return ''
  }

  async generateUploadUrl(todoId: string): Promise<string> {
    console.log('Generating URL')
    const url = await getSignedUrl(
      this.s3Client,
      new PutObjectCommand({ Bucket: this.s3BucketName, Key: todoId }),
      { expiresIn: 1000 }
    )
    console.log(url)
    return url
  }

  async setAttachmentUrl(todoId: string, userId: string, attachmentUrl: string): Promise<void> {
    console.log('Setting attachment URL')
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.todoTable,
        Key: { userId, todoId },
        UpdateExpression: 'set attachmentUrl = :url',
        ConditionExpression: 'attribute_exists(todoId)',
        ExpressionAttributeValues: { ':url': attachmentUrl },
      })
    )
  }
}
