'use client';

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import NextLink from "next/link";
import { ThemeSwitch } from "@/components/theme-switch";
import { useTemperature } from "@/contexts/temperature-unit";

export const Navbar = () => {
  const { unit, toggleUnit } = useTemperature();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <HeroUINavbar maxWidth="xl" position="sticky">
        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
          <NavbarBrand as="li" className="gap-3 max-w-fit">
            <NextLink className="flex justify-start items-center gap-1" href="/">
              <p className="font-bold text-inherit">Weather App</p>
            </NextLink>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem className="flex items-center gap-2">
            <span className="text-sm font-medium mr-2">Calvin Wong</span>
            <Button
              variant="light"
              size="sm"
              onPress={onOpen}
              aria-label="Program Information"
            >
              Info
            </Button>
            <Button
              variant="flat"
              size="sm"
              onClick={toggleUnit}
            >
              {unit === 'celsius' ? '°C' : '°F'}
            </Button>
            <ThemeSwitch />
          </NavbarItem>
        </NavbarContent>
      </HeroUINavbar>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Product Manager Accelerator Program
              </ModalHeader>
              <ModalBody>
                <p>
                  The Product Manager Accelerator Program is designed to support PM professionals through every stage of their careers. From students looking for entry-level jobs to Directors looking to take on a leadership role, our program has helped over hundreds of students fulfill their career aspirations.
                </p>
                <p className="mt-2">
                  Our Product Manager Accelerator community are ambitious and committed. Through our program they have learnt, honed and developed new PM and leadership skills, giving them a strong foundation for their future endeavors.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
