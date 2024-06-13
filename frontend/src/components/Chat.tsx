import { memo, useContext, useEffect, type FormEvent, type FC, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Avatar,
  Box,
  FormControl,
  IconButton,
  InputBase,
  Paper,
  Tooltip,
  Typography,
  Skeleton
} from '@mui/material'
import { Edit, GroupAdd, Send } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useImmer } from 'use-immer'

import { SocketActionKind } from '../stores/reducer/constants'
import { type ServerToClientEvents, SocketContext } from '../stores/SocketContext'
import GroupAvatar from './GroupAvatar'
import Message from './Message'
import UploadButton from './UploadButton'
import { type MessageTypeAPI, type Room, type User } from '../services/api.ts'
import { getMessageFromUnknownError } from '../utils'
import { getSealdSDKInstance } from '../services/seald.ts'
import type { EncryptionSession } from '@seald-io/sdk/browser'

interface ChatState {
  room: null | Room
  messages: DecryptedMessageType[]
  message: string
  users: User[]
  isCustomRoom: boolean
  isRoomInvalid: boolean
  isLoading: boolean
  roomTitle: string
  canCustomizeRoom: boolean
}

type MessageType = {
  encryptedMessage: string
  uploadId: string
  uploadFileName: string
  timestamp: string
  senderId: string
  id: string
} | {
  encryptedMessage: string
  uploadId: null
  uploadFileName: null
  timestamp: string
  senderId: string
  id: string
}

type DecryptedMessageType = MessageType & {
  message: string
}

const serializeMessage = (m: MessageTypeAPI): MessageType =>
  (m.uploadId != null
    ? {
        encryptedMessage: m.content,
        uploadId: m.uploadId,
        uploadFileName: m.uploadFileName,
        timestamp: m.createdAt,
        senderId: m.senderId,
        id: m.id
      }
    : {
        encryptedMessage: m.content,
        uploadId: null,
        uploadFileName: null,
        timestamp: m.createdAt,
        senderId: m.senderId,
        id: m.id
      })

const Chat: FC<{ roomId: string | undefined }> = ({ roomId: currentRoomId }) => {
  const { enqueueSnackbar } = useSnackbar()
  const sealdSessionRef = useRef<EncryptionSession>(null)
  const [{ currentUser, users, rooms, socket }, dispatch] = useContext(SocketContext)
  const [state, setState] = useImmer<ChatState>({
    room: null,
    messages: [],
    message: '',
    users: [],
    isCustomRoom: false,
    isRoomInvalid: false,
    isLoading: true,
    roomTitle: '',
    canCustomizeRoom: false
  })

  const decryptMessage = async (m: MessageType): Promise<DecryptedMessageType> => {
    // If message is a --FILE--, encryptedMessage does not contain an encrypted message
    if (m.encryptedMessage === '--FILE--') return { ...m, message: '--FILE--' }
    try {
      if (sealdSessionRef.current == null) { // no encryption session set in cache yet
        // we try to get it by parsing the current message
        sealdSessionRef.current = await getSealdSDKInstance().retrieveEncryptionSession({ encryptedMessage: m.encryptedMessage })
        // now that we have a session loaded, let's decrypt
      }
      const decryptedMessage = await sealdSessionRef.current.decryptMessage(m.encryptedMessage)
      // we have successfully decrypted the message
      return {
        ...m,
        message: decryptedMessage
      }
    } catch (error) {
      // an error happened, it means that:
      // 1. the encryptedMessage is corrupted;
      // 2. the SDK does not have the rights to decrypt;
      // 3. a random network error happened
      console.error('failed decryption of', m.encryptedMessage, ' with error:', error, 'skipping decryption')
      return {
        ...m,
        message: 'CLEAR ' + m.encryptedMessage
      }
    }
  }

  useEffect(() => {
    const init = async (): Promise<void> => {
      const currentRoom = rooms.find(r => r.id === currentRoomId)
      if (users != null && currentRoom != null && currentUser != null) {
        try {
          if (!(currentRoom.users.includes(currentUser.id))) {
            enqueueSnackbar('Access denied', { variant: 'error' })
            setState(draft => {
              draft.isRoomInvalid = true
            })
          } else {
            setState(draft => {
              draft.message = ''
              draft.isCustomRoom = !currentRoom.one2one
              draft.room = currentRoom
              if (currentRoom.one2one) {
                const otherUserName = users.find(user => currentRoom.users.includes(user.id) && user.id !== currentUser.id)?.name
                draft.roomTitle = otherUserName ?? ''
              } else {
                draft.roomTitle = currentRoom.name
              }
              draft.canCustomizeRoom = !currentRoom.one2one && currentRoom.ownerId === currentUser.id
              draft.users = users.filter(u => currentRoom.users.includes(u.id))
              draft.messages = []
            })

            sealdSessionRef.current = null
            const messages = (await currentRoom.getMessages()).map(serializeMessage)

            const clearMessages = await Promise.all(messages.map(decryptMessage))

            setState(draft => {
              draft.messages = [...clearMessages]
              draft.isLoading = false
            })
          }
        } catch (error) {
          console.error(error)
          enqueueSnackbar(getMessageFromUnknownError(error), { variant: 'error' })
          setState(draft => {
            draft.isRoomInvalid = true
          })
        }
      } else if (state.room != null) { // room is already set, but does not exist anymore, must have been deleted re-render arrived here
        setState(draft => {
          draft.isRoomInvalid = true
        })
      } else {
        enqueueSnackbar('This room does not exist', { variant: 'error' })
        setState(draft => {
          draft.isRoomInvalid = true
        })
      }
    }

    if (currentRoomId != null && currentUser != null && !state.isRoomInvalid) {
      void init()
    } else {
      setState(draft => {
        draft.room = null
        draft.messages = []
        draft.message = ''
      })
    }
  }, [currentRoomId, setState, currentUser, enqueueSnackbar, rooms, state.isRoomInvalid, state.room, users])

  useEffect(() => {
    const removedHandler: ServerToClientEvents['room:removed'] = ({ roomId }) => {
      if (roomId === currentRoomId) {
        setState(draft => {
          draft.isRoomInvalid = true
        })
      }
    }
    if (socket != null) socket.on('room:removed', removedHandler)
    return () => {
      if (socket != null) socket.off('room:removed', removedHandler)
    }
  }, [currentRoomId, setState, socket])

  const handleEditRoom = (): void => {
    if (state.room != null) {
      dispatch({
        type: SocketActionKind.START_EDIT_DIALOG_ROOM,
        payload: {
          room: state.room,
          name: state.room.name,
          selectedUsers: state.room.users,
          sealdSession: sealdSessionRef.current
        }
      })
    }
  }

  const handleSubmitMessage = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    const asyncHandleSubmitMessage = async (): Promise<void> => {
      if (state.room == null) {
        enqueueSnackbar('Please select a room or create a new one', { variant: 'error' })
      } else if (state.message.trim() !== '') {
        try {
          if (sealdSessionRef.current == null) {
            const sealdIds = users.filter(u => state.room?.users.includes(u.id)).map(x => x.sealdId)
            sealdSessionRef.current = await getSealdSDKInstance().createEncryptionSession({ sealdIds }, { metadata: state.room.id })
          }
          const encryptedMessage: string = await sealdSessionRef.current.encryptMessage(state.message)

          await state.room.postMessage(encryptedMessage)

          setState(draft => {
            draft.message = ''
          })
        } catch (error) {
          console.error(error)
          enqueueSnackbar(getMessageFromUnknownError(error), { variant: 'error' })
        }
      }
    }
    void asyncHandleSubmitMessage()
  }

  useEffect(() => {
    const listener: ServerToClientEvents['room:messageSent'] = async (payload) => {
      if (currentRoomId === payload.roomId) {
        const message = serializeMessage(payload)

        const clearMessage = await decryptMessage(message)

        setState(draft => {
          if (draft.messages.find(m => m.id === payload.id) == null) {
            draft.messages = [...draft.messages, clearMessage]
          }
        })
      }
    }
    if (socket != null) socket.on('room:messageSent', listener)
    return () => {
      if (socket != null) socket.off('room:messageSent', listener)
    }
  }, [socket, currentRoomId, setState])

  if (state.isRoomInvalid) return <Navigate to="/rooms"/>

  return (
    <Box display="flex" sx={{ height: '70vh' }} flexDirection="column" bgcolor="background.paper">
      <Paper elevation={1}>
        <Box
          p={2}
          flexShrink={0}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          bgcolor="grey.200"
          color="primary.main"
          height="80px"
        >
          <Box display="flex" flexGrow={1} alignItems="center">
            {state.isLoading && (
              <Skeleton width="30%">
                <Typography>.</Typography>
              </Skeleton>
            )}
            {!state.isLoading && (
              <>
                <Typography variant="h6" component="h1">
                  {state.roomTitle}
                </Typography>
                {state.canCustomizeRoom && (
                  <IconButton
                    style={{
                      marginLeft: 5
                    }}
                    edge="start"
                    size="small"
                    color="secondary"
                    aria-label="edit room"
                    component="span"
                    onClick={handleEditRoom}
                  >
                    <Edit/>
                  </IconButton>
                )}
              </>
            )}
          </Box>

          <Box display="flex" alignItems="center">
            {state.isLoading && (
              <>
                <Skeleton variant="circular">
                  <Avatar/>
                </Skeleton>
                <Skeleton variant="circular">
                  <Avatar/>
                </Skeleton>
              </>
            )}
            {!state.isLoading && (
              <>
                <GroupAvatar users={state.users}/>
                {state.canCustomizeRoom && (
                  <IconButton
                    style={{
                      marginLeft: 5
                    }}
                    edge="start"
                    size="small"
                    color="secondary"
                    aria-label="edit room"
                    component="span"
                    onClick={handleEditRoom}
                  >
                    <GroupAdd/>
                  </IconButton>
                )}
              </>
            )}
          </Box>
        </Box>
      </Paper>
      <Box p={1} style={{ overflowY: 'scroll' }} display="flex" flexDirection="column" flexGrow={1}>
        {state.messages.map(m => {
          const senderId = m.senderId
          const isCurrentUser = senderId === currentUser!.id
          const sender = users.find(u => u.id === senderId)!
          return (
            <Box
              width="100%"
              display="flex"
              justifyContent={isCurrentUser ? 'flex-end' : 'flex-start'}
              key={m.id}
              sx={{
                '&:last-child > div': {
                  mb: 0
                },
                '&:first-of-type': {
                  mt: 'auto'
                }
              }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'flex-end',
                marginBottom: 1
              }}>
                {!isCurrentUser && (
                  <Tooltip title={sender.name}>
                    <Avatar sx={(theme) => ({
                      width: theme.spacing(3),
                      height: theme.spacing(3),
                      mr: 1
                    })} sizes="small"/>
                  </Tooltip>
                )}
                <Message isCurrentUser={isCurrentUser} value={m.message} uploadId={m.uploadId}
                         uploadFileName={m.uploadFileName} sealdSession={sealdSessionRef.current}/>
              </Box>
            </Box>
          )
        })}
      </Box>
      <Box p={2} style={{ paddingBottom: 4, paddingTop: 4 }} flexShrink={0} bgcolor="grey.100">
        <form noValidate onSubmit={handleSubmitMessage}>
          <FormControl disabled={state.isLoading} sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row'
          }} variant="filled">
            <UploadButton room={state.room} sealdSession={sealdSessionRef.current}/>
            <InputBase
              value={state.message}
              onChange={e => {
                const value = e.target.value
                setState(draft => {
                  draft.message = value
                })
              }}
              sx={{ flexGrow: 1 }}
              placeholder="Type a message"
              inputProps={{ 'aria-label': 'type message' }}
            />

            <IconButton
              sx={{
                color: 'grey.500',
                marginLeft: 5
              }}
              edge="start"
              disabled={state.isLoading}
              size="medium"
              color="primary"
              aria-label="send message"
              component="button"
              type="submit"
            >
              <Send/>
            </IconButton>
          </FormControl>
        </form>
      </Box>
    </Box>
  )
}

const MemoizedChat = memo(Chat)
export default MemoizedChat
