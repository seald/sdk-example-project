import { useContext, useEffect, useState, useCallback, type FC } from 'react'

import { useNavigate } from 'react-router-dom'
import { Badge, Box, ListSubheader, Typography, ListItemButton, Avatar, List, ListItem, ListItemAvatar, ListItemText, Skeleton } from '@mui/material'

import { Room, User } from '../services/api'
import { SocketActionKind } from '../stores/reducer/constants'
import { type ServerToClientEvents, SocketContext } from '../stores/SocketContext'
import { enqueueSnackbar } from 'notistack'
import { getMessageFromUnknownError } from '../utils'

const ListOnlines: FC = () => {
  const [{ users, currentUser, rooms, socket }, dispatch] = useContext(SocketContext)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  const handleClickOnUser = useCallback((user: User) => {
    const asyncHandleClickOnUser = async (): Promise<void> => {
      try {
        if (currentUser != null && currentUser.id !== user.id) {
          let room = rooms.find(room => room.one2one && room.users.includes(user.id) && room.users.includes(currentUser.id))
          if (room == null) {
            room = await Room.createOne2One(user.id)
            // should not be necessary because an event with the same info is fired,
            // but automatically filtered out if both are treated
            dispatch({
              type: SocketActionKind.EDIT_OR_ADD_ROOM,
              payload: {
                room
              }
            })
          }
          navigate({
            pathname: `/rooms/${room.id}`
          })
        }
      } catch (error) {
        console.error(error)
        enqueueSnackbar(getMessageFromUnknownError(error), { variant: 'error' })
      }
    }

    void asyncHandleClickOnUser()
  }, [currentUser, dispatch, navigate, rooms])

  useEffect(() => {
    const init = async () => {
      try {
        const users = await User.list()
        dispatch({
          type: SocketActionKind.SET_USERS,
          payload: {
            users
          }
        })
        setIsLoading(false)
      } catch (error) {
        console.error(error)
        setIsLoading(false)
      }

      const createdHandler: ServerToClientEvents['user:created'] = user => {
        dispatch({
          type: SocketActionKind.ADD_USER,
          payload: {
            user: new User(user)
          }
        })
      }
      if (socket != null) {
        socket.on('user:created', createdHandler)
      }
      return () => {
        if (socket != null) {
          socket.off('user:created', createdHandler)
        }
      }
    }
    void init()
  }, [dispatch, socket])

  return (
    <List
      sx={{
        width: '100%',
        overflow: 'auto',
        height: '100%'
      }}
      subheader={
        <ListSubheader sx={{
          zIndex: 2, // Above badge login
          backgroundColor: 'primary.dark',
          color: 'primary.contrastText'
        }} component="div" id="nested-list-subheader">
          Users ({users.length})
        </ListSubheader>
      }
    >
      {isLoading &&
        [1, 2, 3].map(i => (
          <ListItem key={i}>
            <ListItemAvatar>
              <Skeleton variant="circular">
                <Avatar/>
              </Skeleton>
            </ListItemAvatar>
            <ListItemText>
              <Skeleton width="50%">
                <Typography>.</Typography>
              </Skeleton>
            </ListItemText>
          </ListItem>
        ))}
      {!isLoading &&
        users.map(user => {
          const labelId = `checkbox-list-secondary-label-${user.id}`

          const listItemChildren = <>
          <ListItemAvatar>
                <Badge
                  color="success"
                  overlap="circular"
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                  }}
                  variant="dot"
                  badgeContent=" "
                >
                  <Avatar alt={user.name}/>
                </Badge>
          </ListItemAvatar>
          <ListItemText
            id={labelId}
            primary={
              <Box display="flex" alignItems="center">
                <Typography>{user.name}</Typography>
                {currentUser?.id === user.id
                  ? (
                    <Typography sx={{ ml: 1 }} variant="caption">
                      (you)
                    </Typography>
                    )
                  : null}
              </Box>
            }
          />
          </>

          if (currentUser?.id !== user.id) {
            return (
            <ListItemButton
              key={user.id}
              onClick={() => { handleClickOnUser(user) }}
            >
              {listItemChildren}
            </ListItemButton>
            )
          } else {
            return (
              <ListItem
                key={user.id}
              >
                {listItemChildren}
              </ListItem>
            )
          }
        })}
    </List>
  )
}

export default ListOnlines
