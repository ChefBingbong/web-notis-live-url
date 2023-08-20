import { useTranslation } from '@pancakeswap/localization'
import { AnimatePresence, Box, ChevronDownIcon, ChevronUpIcon, CloseIcon, Flex, Row, Text } from '@pancakeswap/uikit'
import { PushClientTypes } from '@walletconnect/push-client'
import { ASSET_CDN } from 'config/constants/endpoints'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from 'styled-components'
import {
  ContentsContainer,
  Description,
  ExpandButton,
  StyledLink,
  StyledNotificationWrapper,
} from 'views/Notifications/styles'
import { formatTime } from 'views/Notifications/utils/date'
import FlexRow from 'views/Predictions/components/FlexRow'
import { useChainId } from 'wagmi'

interface INotificationprops {
  title: string
  description: string
  id: number
  date: number
  removeNotification: (id: number) => Promise<void>
  url?: string | undefined
  image?: string | undefined
}

interface INotificationContainerProps {
  notifications: PushClientTypes.PushMessageRecord[]
  sortOptionsType: string
  removeNotification: (id: number) => Promise<void>
}
const formatStringWithNewlines = (inputString: string) => {
  return inputString.split('\n').map((line: string, index: number) => (
    // eslint-disable-next-line react/no-array-index-key
    <Text key={`message-line-${index}`} lineHeight="15px" color="textSubtle">
      {line}
    </Text>
  ))
}

const NotificationItem = ({ title, description, id, date, url, removeNotification }: INotificationprops) => {
  const [isHovered, setIsHovered] = useState(false)
  const [show, setShow] = useState<boolean>(false)
  const [elementHeight, setElementHeight] = useState<number>(0)
  const [isClosing, setIsClosing] = useState<boolean>(false)
  const formattedDate = formatTime(Math.floor(date / 1000).toString())
  const containerRef = useRef(null)
  const chainId = useChainId()
  const contentRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()
  const { t } = useTranslation()

  const deleteNotification = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      setIsClosing(true)
      setTimeout(() => {
        removeNotification(id).then(() => setIsClosing(false))
      }, 300)
    },
    [removeNotification, id],
  )

  const handleHover = useCallback(() => setIsHovered(!isHovered), [isHovered])

  const handleExpandClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement
      if (target.tagName !== 'BUTTON') setShow(!show)
    },
    [show],
  )

  useEffect(() => {
    if (contentRef.current) setElementHeight(contentRef.current.scrollHeight)
  }, [])

  const formatedDescription = formatStringWithNewlines(description)

  return (
    <StyledNotificationWrapper isclosing={isClosing} ref={containerRef} onClick={handleExpandClick}>
      <AnimatePresence>
        <ContentsContainer
          transition={{ duration: 0.3 }}
          style={{
            backgroundColor: isHovered ? 'transparent' : theme.isDark ? '#372F46' : '#EDEAF4',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={handleHover}
          onMouseLeave={handleHover}
        >
          <Box marginRight="15px" display="flex" minWidth="40px">
            <Image
              src={title.includes('Price') ? `${ASSET_CDN}/web/chains/${chainId}.png` : '/logo.png'}
              alt="Notification Image"
              height={40}
              width={40}
              unoptimized
            />
          </Box>
          <Flex flexDirection="column">
            <Flex justifyContent="space-between">
              <Text fontWeight="bold">{title}</Text>
              <Box paddingX="5px" height="fit-content" onClick={deleteNotification}>
                <CloseIcon cursor="pointer" />
              </Box>
            </Flex>
            <Description
              ref={contentRef}
              transition={{ duration: 0.33, ease: 'easeInOut' }}
              initial={{ maxHeight: 32 }}
              animate={{ maxHeight: show ? elementHeight : 32 }}
            >
              {formatedDescription}
              <StyledLink hidden={Boolean(url)} href={url} target="_blank" rel="noreferrer noopener">
                {t('View Link')}
              </StyledLink>
            </Description>
            <BottomRow show={show} formattedDate={formattedDate} />
          </Flex>
        </ContentsContainer>
      </AnimatePresence>
    </StyledNotificationWrapper>
  )
}

const BottomRow = ({ show, formattedDate }: { show: boolean; formattedDate: string }) => {
  const { t } = useTranslation()
  return (
    <Row justifyContent="space-between" marginTop="6px">
      <FlexRow>
        <ExpandButton color="secondary" fontSize="15px">
          {show ? t('Show Less') : t('Show More')}
        </ExpandButton>
        {show ? <ChevronUpIcon color="secondary" /> : <ChevronDownIcon color="secondary" />}
      </FlexRow>
      <Text fontSize="15px" marginRight="8px">
        {formattedDate}
      </Text>
    </Row>
  )
}

const NotificationContainer = ({ notifications, sortOptionsType, removeNotification }: INotificationContainerProps) => {
  return (
    <Box>
      {notifications
        .sort((a: PushClientTypes.PushMessageRecord, b: PushClientTypes.PushMessageRecord) => {
          if (sortOptionsType === 'Latest') return b.publishedAt - a.publishedAt
          return a.publishedAt - b.publishedAt
        })
        .map((notification: PushClientTypes.PushMessageRecord) => {
          return (
            <NotificationItem
              key={notification.id}
              title={notification.message.title}
              description={notification.message.body}
              id={notification.id}
              date={notification.publishedAt}
              url={notification.message.url}
              image={notification.message.icon}
              removeNotification={removeNotification}
            />
          )
        })}
    </Box>
  )
}

export default NotificationContainer
