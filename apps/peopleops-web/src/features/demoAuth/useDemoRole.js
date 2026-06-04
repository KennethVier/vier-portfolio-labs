import { useContext } from 'react';
import { DemoRoleContext } from './demoRoleContext.js';

export const useDemoRole = () => useContext(DemoRoleContext);
