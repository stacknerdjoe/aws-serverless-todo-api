import { v4 as uuidv4 } from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodoUpdate } from '../models/TodoUpdate'
import { ToDoAccess } from '../dataLayer/ToDoAccess'

const toDoAccess = new ToDoAccess()

export async function getAllToDo(userId: string): Promise<TodoItem[]> {
  return toDoAccess.getAllToDo(userId)
}

export function createToDo(createTodoRequest: CreateTodoRequest, userId: string): Promise<TodoItem> {
  const todoId = uuidv4()
  return toDoAccess.createToDo({
    userId,
    todoId,
    createdAt: new Date().getTime().toString(),
    done: false,
    ...createTodoRequest,
  })
}

export function updateToDo(updateTodoRequest: UpdateTodoRequest, todoId: string, userId: string): Promise<TodoUpdate> {
  return toDoAccess.updateToDo(updateTodoRequest, todoId, userId)
}

export function deleteToDo(todoId: string, userId: string): Promise<string> {
  return toDoAccess.deleteToDo(todoId, userId)
}

export async function generateUploadUrl(todoId: string, userId: string): Promise<string> {
  const uploadUrl = await toDoAccess.generateUploadUrl(todoId)
  const attachmentUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${todoId}`
  await toDoAccess.setAttachmentUrl(todoId, userId, attachmentUrl)
  return uploadUrl
}
