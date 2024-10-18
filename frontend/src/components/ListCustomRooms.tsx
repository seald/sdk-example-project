import { type FC, useContext, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Box, IconButton, ListSubheader, Typography } from '@mui/material'
import Avatar from '@mui/material/Avatar'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import DeleteIcon from '@mui/icons-material/Delete'

import { SocketContext } from '../stores/SocketContext'
import RemoveDialogRoom, { type RemoveDialogRoomHandle } from './RemoveDialogRoom'
import { styled } from '@mui/system'

const SmallAvatar = styled(Avatar)(({ theme }) => ({
  root: {
    width: 22,
    height: 22,
    border: `2px solid ${theme.palette.background.paper}`
  }
}))

const ListCustomRooms: FC = () => {
  const [{ currentUser, users, rooms }] = useContext(SocketContext)
  const modal = useRef<RemoveDialogRoomHandle | null>(null)

  return (
    <>
      <List
        sx={{
          width: '100%',
          overflowY: 'auto',
          height: '100%'
        }}
        subheader={
          <ListSubheader
            sx={{
              zIndex: 2, // Above badge login
              backgroundColor: 'primary.dark',
              color: 'primary.contrastText'
            }}
            display='flex'
            component={Box}
            id='nested-list-subheader'
          >
            Rooms ({rooms.filter(r => !r.one2one).length})
          </ListSubheader>
      }
      >
        {rooms.filter(r => !r.one2one).map(room => {
          const owner = users.find(u => u.id === room.ownerId)
          const roomUsers = users
            .filter(user => user.id !== room.ownerId && room.users.some(id => id === user.id))
          const hasMultiUsers = roomUsers.length > 0
          return (
            <ListItem
              key={room.id}
              button
              component={Link}
              to={{
                pathname: `/rooms/${room.id}`
              }}
            >
              <ListItemAvatar>
                {hasMultiUsers
                  ? (
                    <Badge
                      overlap='circular'
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                      }}
                      badgeContent={<SmallAvatar alt={roomUsers[0]?.name}/>}
                    >
                      <Avatar alt={owner?.name}/>
                    </Badge>
                    )
                  : (
                    <Avatar alt={owner?.name}/>
                    )}
              </ListItemAvatar>
              <ListItemText
                id={room.id}
                primary={
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                  >
                    <Typography>{room.name}</Typography>
                    {currentUser != null && currentUser.id === owner?.id && (
                      <IconButton
                        edge='start'
                        size='small'
                        color='inherit'
                        aria-label='add room'
                        component='span'
                        onClick={e => {
                          e.preventDefault()
                          if (modal.current != null) modal.current.openDialog(room)
                        }}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    )}
                  </Box>
              }
              />
            </ListItem>
          )
        })}
      </List>
      <RemoveDialogRoom ref={modal} />
    </>
  )
}
export default ListCustomRooms
