'use client'

import {getCruddappProgram, getCruddappProgramId} from '@project/anchor'
import {useConnection} from '@solana/wallet-adapter-react'
import {Cluster, Keypair, PublicKey} from '@solana/web3.js'
import {useMutation, useQuery} from '@tanstack/react-query'
import {useMemo} from 'react'
import toast from 'react-hot-toast'
import {useCluster} from '../cluster/cluster-data-access'
import {useAnchorProvider} from '../solana/solana-provider'
import {useTransactionToast} from '../ui/ui-layout'
import { error } from 'console'
import { title } from 'process'

interface CreateEntryArgs{
  title: string;
  message: string;
  owner: PublicKey;
}

export function useCruddappProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCruddappProgramId(cluster.network as Cluster), [cluster])
  const program = getCruddappProgram(provider)

  const accounts = useQuery({
    queryKey: ['cruddapp', 'all', { cluster }],
    queryFn: () => program.account.journalEntryState.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createEnrty = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: [`journalEntry`, `create`, {cluster}],
    mutationFn: async ({title, message, owner}) =>{
      return program.methods.createJournalEntry(title, message,).rpc();
    },
    onSuccess: (signature) =>{
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error creating entry: ${error.message}`);
    }
  });
  return{
    program,
    accounts,
    getProgramAccount,
    createEnrty,
    programId
  };
}

export function useCruddappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCruddappProgram()

  const accountQuery = useQuery({
    queryKey: ['cruddapp', 'fetch', { cluster, account }],
    queryFn: () => program.account.journalEntryState.fetch(account),
  })

  const updateEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: [`journalEntry`, `update`, {cluster}],
    mutationFn: async ({ title, message}) => {
      return program.methods.updateJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) =>{
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error updating entry: ${error.message}`);
    },
  });

  const deleteEntry = useMutation({
    mutationKey: [`journalEntry`, `update`, {cluster}],
    mutationFn: (title: string) =>{
      return program.methods.deleteJournalEntry(title).rpc();
    },
    onSuccess: (signature) =>{
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error deleting entry: ${error.message}`);
    }
  })

  return {
    accountQuery,
    updateEntry,
    deleteEntry,
  };
}
