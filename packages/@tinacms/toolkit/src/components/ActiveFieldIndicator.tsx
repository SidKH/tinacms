/**

Copyright 2021 Forestry.io Holdings, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/
import * as React from 'react'
import styled from 'styled-components'
import { ChevronUpIcon, ChevronDownIcon } from '../packages/icons'
import { useEvent } from '../packages/react-core/use-cms-event'
import {
  FieldHoverEvent,
  FieldFocusEvent,
} from '../packages/fields/field-events'
import { useFieldReference } from '../hooks/use-field-reference'

const IndicatorWrap = styled.div`
  position: fixed;
  z-index: var(--tina-z-index-3);
  left: 0;
  padding: 0.5rem 0;
  margin-left: var(--tina-sidebar-width);
  width: calc(100% - var(--tina-sidebar-width));
  text-align: center;
  top: ${(props: { position?: 'top' | 'bottom' }) =>
    props.position === 'top' ? 0 : 'auto'};
  bottom: ${(props: { position?: 'top' | 'bottom' }) =>
    props.position === 'top' ? 'auto' : 0};
`

const ArrowWrap = styled.div`
  display: inline-block;
  fill: white;
  background-color: var(--tina-color-primary);
  border-radius: 50%;
  box-shadow: 0 0 10px -5px;
`

const AboveViewportIndicator = () => {
  return (
    <IndicatorWrap position="top">
      <ArrowWrap>
        <ChevronUpIcon />
      </ArrowWrap>
    </IndicatorWrap>
  )
}

const BelowViewportIndicator = () => {
  return (
    <IndicatorWrap position="bottom">
      <ArrowWrap>
        <ChevronDownIcon />
      </ArrowWrap>
    </IndicatorWrap>
  )
}

const useScrollToFocusedField = () => {
  const { subscribe } = useEvent<FieldFocusEvent>('field:focus')
  React.useEffect(() =>
    subscribe(({ fieldName }) => {
      const ele = document.querySelector<HTMLElement>(
        `[data-tinafield="${fieldName}"]`
      )
      if (!ele) return
      const { top, height } = ele.getBoundingClientRect()
      /**
       * if element height < window height
       *  if element bottom < window bottom
       *    scroll so bottom of ele is at window bottom
       * else
       *  if element top < window bottom
       */
      const eleTopY = top + window.scrollY
      const eleBottomY = top + height + window.scrollY
      const viewportTopY = window.scrollY
      const viewportBottomY = window.innerHeight + window.scrollY
      if (height < window.innerHeight) {
        // if the element is smaller than the viewport, scroll entire element into view
        if (eleBottomY > viewportBottomY) {
          // scroll up so entire element is in view
          window.scrollTo({
            top: eleBottomY - window.innerHeight,
            behavior: 'smooth',
          })
        } else if (eleTopY < viewportTopY) {
          // scroll down so entire element is in view
          window.scrollTo({
            top: eleTopY,
            behavior: 'smooth',
          })
        }
      } else {
        // if the element is >= viewport size, meet nearest edges
        if (eleBottomY < viewportBottomY) {
          // anchor element bottom to viewport bottom
          window.scrollTo({
            top: eleBottomY - window.innerHeight,
            behavior: 'smooth',
          })
        } else if (eleTopY > viewportTopY) {
          // anchor element top to viewport top
          window.scrollTo({
            top: eleTopY,
            behavior: 'smooth',
          })
        }
      }
    })
  )
}

export const ActiveFieldIndicator = () => {
  const [activeFieldName, setActiveFieldName] = React.useState<string | null>(
    null
  )
  const activeEle = useFieldReference(activeFieldName)

  const [, setArbitraryValue] = React.useState(0)
  const rerender = () => setArbitraryValue((s) => s + 1)

  React.useEffect(() => {
    window.addEventListener('scroll', rerender)
    return () => {
      window.removeEventListener('scroll', rerender)
    }
  }, [])

  const { subscribe } = useEvent<FieldHoverEvent>('field:hover')

  React.useEffect(() =>
    subscribe(({ fieldName }) => {
      setActiveFieldName(fieldName)
    })
  )

  useScrollToFocusedField()

  if (!activeEle) return null

  const { top, left, width, height } = activeEle.getBoundingClientRect()

  const eleTopY = top + window.scrollY
  const eleBottomY = top + height + window.scrollY
  const viewportTopY = window.scrollY
  const viewportBottomY = window.innerHeight + window.scrollY

  if (eleTopY > viewportBottomY) {
    // element is below the viewport
    return <BelowViewportIndicator />
  }

  if (eleBottomY < viewportTopY) {
    // element is above the viewport
    return <AboveViewportIndicator />
  }

  return (
    <div
      style={{
        position: 'absolute',
        // @ts-ignore it's a number, trust me
        zIndex: `var(--tina-z-index-3)`,
        top: top + window.scrollY,
        left: left + window.scrollX,
        width,
        height,
        outline: '2px dashed var(--tina-color-indicator)',
      }}
    ></div>
  )
}