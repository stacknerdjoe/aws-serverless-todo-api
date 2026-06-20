import * as React from 'react'
import { Form, Button } from 'semantic-ui-react'
import { useParams } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { getUploadUrl, uploadFile } from '../api/todos-api'

enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile,
}

export function EditTodo() {
  const auth = useAuth()
  const { todoId } = useParams<{ todoId: string }>()
  const [file, setFile] = React.useState<File | undefined>(undefined)
  const [uploadState, setUploadState] = React.useState(UploadState.NoUpload)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    setFile(files[0])
  }

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      if (!file) {
        alert('File should be selected')
        return
      }

      setUploadState(UploadState.FetchingPresignedUrl)
      const uploadUrl = await getUploadUrl(auth.user!.access_token, todoId)

      setUploadState(UploadState.UploadingFile)
      await uploadFile(uploadUrl, file)

      alert('File was uploaded!')
    } catch (e) {
      alert('Could not upload a file: ' + e.message)
    } finally {
      setUploadState(UploadState.NoUpload)
    }
  }

  const renderButton = () => {
    return (
      <div>
        {uploadState === UploadState.FetchingPresignedUrl && <p>Uploading image metadata</p>}
        {uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        <Button
          loading={uploadState !== UploadState.NoUpload}
          type="submit"
        >
          Upload
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h1>Upload new image</h1>

      <Form onSubmit={handleSubmit}>
        <Form.Field>
          <label>File</label>
          <input
            type="file"
            accept="image/*"
            placeholder="Image to upload"
            onChange={handleFileChange}
          />
        </Form.Field>

        {renderButton()}
      </Form>
    </div>
  )
}
