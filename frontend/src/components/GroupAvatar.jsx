import React from 'react'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'

function GroupAvatars ({ users, max = 3 }) {
  return (
    <AvatarGroup max={max}>
      {users.map(user => (
        <Avatar key={user.id} alt={user.name} src={user.photoURL} />
      ))}
    </AvatarGroup>
  )
}

export default GroupAvatars
